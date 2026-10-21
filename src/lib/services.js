import emailjs from "@emailjs/browser";

const settings = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID?.trim(),
  orderTemplateId: (
    import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID ||
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
    ""
  ).trim(),
  customerTemplateId: (
    import.meta.env.VITE_EMAILJS_CUSTOMER_TEMPLATE_ID ||
    import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID ||
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
    ""
  ).trim(),
  reviewTemplateId: import.meta.env.VITE_EMAILJS_REVIEW_TEMPLATE_ID?.trim(),
  contactTemplateId: (
    import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID ||
    import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID ||
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
    ""
  ).trim(),
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY?.trim(),
  storeEmail: import.meta.env.VITE_STORE_EMAIL?.trim(),
};
const backupSettings = {
  serviceId: import.meta.env.VITE_EMAILJS_BACKUP_SERVICE_ID?.trim(),
  orderTemplateId:
    import.meta.env.VITE_EMAILJS_BACKUP_ORDER_TEMPLATE_ID?.trim(),
  customerTemplateId:
    import.meta.env.VITE_EMAILJS_BACKUP_CUSTOMER_TEMPLATE_ID?.trim(),
  reviewTemplateId:
    import.meta.env.VITE_EMAILJS_BACKUP_REVIEW_TEMPLATE_ID?.trim(),
  contactTemplateId:
    import.meta.env.VITE_EMAILJS_BACKUP_CONTACT_TEMPLATE_ID?.trim(),
  publicKey: import.meta.env.VITE_EMAILJS_BACKUP_PUBLIC_KEY?.trim(),
};
export const backupEmailConfigured = Boolean(
  backupSettings.serviceId &&
  backupSettings.orderTemplateId &&
  backupSettings.publicKey,
);
export const missingOrderEmailSettings = [
  ["VITE_EMAILJS_SERVICE_ID", settings.serviceId],
  [
    "VITE_EMAILJS_ORDER_TEMPLATE_ID (or VITE_EMAILJS_TEMPLATE_ID)",
    settings.orderTemplateId,
  ],
  ["VITE_EMAILJS_PUBLIC_KEY", settings.publicKey],
  ["VITE_STORE_EMAIL", settings.storeEmail],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);
export const emailConfigured = missingOrderEmailSettings.length === 0;
export const contactEmailConfigured = Boolean(
  settings.serviceId &&
  settings.contactTemplateId &&
  settings.publicKey &&
  settings.storeEmail,
);
export const reviewEmailConfigured = Boolean(
  settings.serviceId &&
  settings.reviewTemplateId &&
  settings.publicKey &&
  settings.storeEmail,
);

const makeRequestId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const makeOrderNumber = () => {
  const random =
    globalThis.crypto
      ?.randomUUID?.()
      .replaceAll("-", "")
      .slice(0, 12)
      .toUpperCase() || Math.random().toString(36).slice(2, 14).toUpperCase();
  return `CB-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${random}`;
};
const money = (value) => `BDT ${Number(value || 0).toLocaleString("en-BD")}`;

function isEmailJsQuotaError(error) {
  const status = Number(error?.status || error?.response?.status || 0);
  const detail = `${error?.text || ""} ${error?.message || ""}`.toLowerCase();
  return (
    status === 426 ||
    status === 429 ||
    /quota|monthly limit|request limit|too many requests|rate limit/.test(
      detail,
    )
  );
}

function backupTemplateFor(context) {
  if (context.action === "send-contact-email")
    return backupSettings.contactTemplateId;
  if (context.action === "send-customer-review")
    return backupSettings.reviewTemplateId;
  if (context.recipientRole === "customer")
    return backupSettings.customerTemplateId || backupSettings.orderTemplateId;
  return backupSettings.orderTemplateId;
}

async function sendOne(message, context) {
  const templateId = context.templateId || settings.orderTemplateId;
  try {
    await emailjs.send(
      settings.serviceId,
      templateId,
      message,
      settings.publicKey,
    );
    return "emailjs-primary";
  } catch (primaryError) {
    if (!isEmailJsQuotaError(primaryError)) throw primaryError;
    if (!backupEmailConfigured)
      throw new Error(
        "The primary EmailJS account has reached its sending limit, and the backup EmailJS account is not configured.",
      );
    const backupTemplateId = backupTemplateFor(context);
    if (!backupTemplateId)
      throw new Error(
        `The primary EmailJS account has reached its sending limit, but the backup ${context.action === "send-contact-email" ? "contact" : context.action === "send-customer-review" ? "review" : "order"} template is not configured.`,
      );
    try {
      await emailjs.send(
        backupSettings.serviceId,
        backupTemplateId,
        message,
        backupSettings.publicKey,
      );
      return "emailjs-backup";
    } catch (backupError) {
      const detail =
        backupError?.text ||
        backupError?.message ||
        "EmailJS returned an unknown error.";
      throw new Error(
        `The primary EmailJS account reached its limit and the backup account could not send the message: ${detail}`,
      );
    }
  }
}

export async function placeOrder(payload) {
  if (!emailConfigured)
    throw new Error(
      "Order email is not configured. Please add the EmailJS order template IDs and store email before enabling checkout.",
    );
  const orderNumber = makeOrderNumber();
  const order = { ...payload, orderNumber };
  const lines = order.items.map((item) => {
    const boxLine = item.premiumBoxQuantity
      ? `\n   Gift box: ${item.premiumBoxQuantity} × ${item.premiumBoxName} at ${money(item.premiumBoxPrice)} each; ${Math.max(0, item.quantity - item.premiumBoxQuantity)} complimentary standard box(es)`
      : "\n   Gift box: Standard Box (complimentary)";
    return `${item.quantity} × ${item.name} — ${money(item.price * item.quantity)}${boxLine}`;
  });
  const amountText = [
    `Products: ${money(order.subtotal)}`,
    `Premium boxes: ${money(order.boxTotal)}`,
    `Delivery: ${money(order.shippingFee)}`,
    order.couponCode ? `Coupon: ${order.couponCode}` : "",
    order.discountAmount
      ? `Coupon discount: -${money(order.discountAmount)}`
      : "",
    order.deliveryDiscount
      ? `Delivery discount: -${money(order.deliveryDiscount)}`
      : "",
    `Total: ${money(order.total)}`,
  ]
    .filter(Boolean)
    .join("\n");
  const deliveryText = `${order.customer.address}, ${order.customer.area} Division, ${order.customer.city}${order.customer.postalCode ? ` ${order.customer.postalCode}` : ""}`;
  const context = {
    action: "send-order-email",
    requestId: order.requestId,
    orderNumber,
  };
  const common = {
    order_number: orderNumber,
    order_items: lines.join("\n"),
    order_summary: amountText,
    customer_name: order.customer.name,
    customer_whatsapp: order.customer.whatsapp || order.customer.phone,
    customer_email: order.customer.email || "Not provided",
    delivery_address: deliveryText,
    payment_method: order.paymentMethod,
    coupon_code: order.couponCode || "None",
    coupon_discount: money(order.discountAmount),
    delivery_discount: money(order.deliveryDiscount),
    premium_box_total: money(order.boxTotal),
    total_amount: money(order.total),
    store_email: settings.storeEmail,
  };
  const messages = [
    {
      recipientRole: "store",
      templateId: settings.orderTemplateId,
      message: {
        ...common,
        to_email: settings.storeEmail,
        reply_to: order.customer.email || "",
        subject: `New Chronova order request · ${orderNumber}`,
        message_text: `New Chronova order request ${orderNumber}\n\nCustomer: ${order.customer.name}\nWhatsApp: ${order.customer.whatsapp || order.customer.phone}\nEmail: ${order.customer.email || "Not provided"}\nDelivery: ${deliveryText}\nNotes: ${order.customer.notes || "None"}\nPayment preference: ${order.paymentMethod}\n\n${lines.join("\n")}\n\n${amountText}\n\nPlease verify item availability, stock, pricing, coupon eligibility and delivery details before confirming.`,
      },
    },
  ];
  if (order.customer.email) {
    messages.push({
      recipientRole: "customer",
      templateId: settings.customerTemplateId,
      message: {
        ...common,
        to_email: order.customer.email,
        reply_to: settings.storeEmail,
        subject: `We received your Chronova order · ${orderNumber}`,
        message_text: `Dear ${order.customer.name},\n\nWe received your order request ${orderNumber}. Our team will confirm availability and delivery details by WhatsApp. Please wait for confirmation before making any payment.\n\n${lines.join("\n")}\n\n${amountText}\n\nChronova BD`,
      },
    });
  }
  const results = await Promise.allSettled(
    messages.map((item) =>
      sendOne(item.message, {
        ...context,
        recipientRole: item.recipientRole,
        templateId: item.templateId,
      }),
    ),
  );
  const sent = results.filter((result) => result.status === "fulfilled").length;
  if (sent !== messages.length)
    throw new Error(
      "The order notification could not be confirmed. Please contact Chronova BD through WhatsApp before retrying.",
    );
  return {
    orderNumber,
    mode: "email",
    notification: "sent",
    emailProviders: [...new Set(results.map((result) => result.value))],
    total: order.total,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    status: "Order request emailed",
  };
}

export async function sendContactMessage({
  name,
  email,
  topic,
  message,
  whatsapp,
}) {
  if (
    !settings.serviceId ||
    !settings.contactTemplateId ||
    !settings.publicKey ||
    !settings.storeEmail
  )
    throw new Error(
      "Contact email is not configured yet. Please use the WhatsApp contact link.",
    );
  const requestId = makeRequestId();
  const data = {
    to_email: settings.storeEmail,
    reply_to: email || "",
    name: "Chronova BD",
    subject: `Chronova website message — ${topic}`,
    message_text: `A message from the Chronova BD website.\n\nName: ${name}\nWhatsApp: ${whatsapp || "Not provided"}\nEmail: ${email || "Not provided"}\nTopic: ${topic}\n\n${message}`,
  };
  await sendOne(data, {
    action: "send-contact-email",
    requestId,
    recipientRole: "store",
    templateId: settings.contactTemplateId,
  });
  return true;
}

export async function sendReviewMessage(review) {
  if (!reviewEmailConfigured)
    throw new Error(
      "Review email is not configured. Add the review template ID to the private storefront environment.",
    );
  const requestId = makeRequestId();
  const data = {
    to_email: settings.storeEmail,
    reply_to: "",
    name: "Chronova BD review form",
    subject: `Customer review · Order ${review.orderNumber}`,
    message_text: `New customer review received.\n\nOrder: ${review.orderNumber}\nReviewer: ${review.name}\nAddress: ${review.address}\nWhatsApp: ${review.whatsapp}\nRating: ${review.rating}/5\n\n${review.reviewText}\n\nReview token: ${review.token}`,
    ...review,
  };
  await sendOne(data, {
    action: "send-customer-review",
    requestId,
    orderNumber: review.orderNumber,
    recipientRole: "store",
    templateId: settings.reviewTemplateId,
  });
  return true;
}
