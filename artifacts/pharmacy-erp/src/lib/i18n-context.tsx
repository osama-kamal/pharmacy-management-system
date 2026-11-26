import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "EN" | "AR";

const arabic: Record<string, string> = {
  Pharmacy: "الصيدلية",
  "MAIN MENU": "القائمة الرئيسية",
  LEADS: "المبيعات",
  COMMS: "الإدارة",
  Dashboard: "لوحة التحكم",
  Products: "المنتجات",
  Categories: "التصنيفات",
  Orders: "الطلبات",
  Sales: "المبيعات",
  Customers: "العملاء",
  Payments: "المدفوعات",
  Reports: "التقارير",
  Settings: "الإعدادات",
  "Point of Sale": "نقطة البيع",
  "Inventory Control": "إدارة المخزون",
  "Suppliers & Purchasing": "الموردون والمشتريات",
  Administration: "إدارة النظام",
  Search: "بحث",
  English: "English",
  العربية: "العربية",
  "Profile settings": "إعدادات الملف الشخصي",
  "Sign out": "تسجيل الخروج",
  "Complete Profile": "استكمال الملف الشخصي",
  "Complete Your Profile to": "أكمل ملفك الشخصي من أجل",
  "Unlock all Features": "فتح جميع المزايا",
  "Verify Identity": "تحقق من الهوية",
  "Loading workspace...": "جارٍ تحميل مساحة العمل...",
  "Welcome Code Astro!": "مرحبًا بك في صيدليتك!",
  "Pharmacy Sales Results": "نتائج مبيعات الصيدلية",
  "Todays Sales": "مبيعات اليوم",
  "Available Categories": "التصنيفات المتاحة",
  "Expired Medicines": "الأدوية منتهية الصلاحية",
  "System Users": "مستخدمو النظام",
  "Graph Report": "تقرير بياني",
  "Total Sales Overview": "نظرة عامة على المبيعات",
  "Recent Sales List": "أحدث المبيعات",
  "Team Member": "عضو الفريق",
  "Products Inventory": "مخزون المنتجات",
  "Inventory / Catalog": "المخزون / الكتالوج",
  "Keep every item, batch, and expiry date in view.": "تابع كل منتج ودفعة وتاريخ صلاحية.",
  "Add product": "إضافة منتج",
  "Product Distribution": "توزيع المنتجات",
  "Top-Selling Products": "المنتجات الأكثر مبيعًا",
  "Out of Stock Products": "منتجات نفدت من المخزون",
  "Total Product Sales": "إجمالي مبيعات المنتجات",
  "Products List": "قائمة المنتجات",
  "Search products or SKU...": "ابحث عن منتج أو كود...",
  "Filter products": "تصفية المنتجات",
  Filter: "تصفية",
  "Add Product": "إضافة منتج",
  "Edit product": "تعديل المنتج",
  "Save product": "حفظ المنتج",
  "Product name": "اسم المنتج",
  SKU: "كود المنتج",
  Category: "التصنيف",
  Stock: "المخزون",
  Price: "السعر",
  Expiry: "الصلاحية",
  Status: "الحالة",
  Supplier: "المورّد",
  Description: "الوصف",
  Product: "المنتج",
  "In stock": "متوفر",
  "Low stock": "مخزون منخفض",
  "Out of stock": "نفد المخزون",
  All: "الكل",
  "Add category": "إضافة تصنيف",
  "Edit category": "تعديل التصنيف",
  "Save category": "حفظ التصنيف",
  "Category name": "اسم التصنيف",
  Color: "اللون",
  "Orders Management": "إدارة الطلبات",
  "Commerce / Fulfillment": "التجارة / التنفيذ",
  "Track every order from counter to completed pickup.": "تابع كل طلب من الاستلام حتى الاكتمال.",
  "Create order": "إنشاء طلب",
  "Recent Orders": "أحدث الطلبات",
  "Search order or customer...": "ابحث عن طلب أو عميل...",
  "Total Orders": "إجمالي الطلبات",
  "Revenue From Orders": "إيرادات الطلبات",
  "Pending Orders": "الطلبات المعلقة",
  Order: "الطلب",
  Customer: "العميل",
  Qty: "الكمية",
  Total: "الإجمالي",
  Payment: "الدفع",
  Date: "التاريخ",
  "Payment Method": "طريقة الدفع",
  Quantity: "الكمية",
  Pending: "معلق",
  Processing: "قيد التنفيذ",
  Completed: "مكتمل",
  Cancelled: "ملغي",
  "Save order": "حفظ الطلب",
  "Sales Overview": "نظرة عامة على المبيعات",
  "Export Report": "تصدير التقرير",
  "Total Sale": "إجمالي المبيعات",
  "Total Order": "إجمالي الطلبات",
  "In-Store Sales": "مبيعات المتجر",
  "Online Sales": "المبيعات الإلكترونية",
  "Total Sales": "إجمالي المبيعات",
  "Revenue By Category": "الإيراد حسب التصنيف",
  "Weekly Sales Performance": "أداء المبيعات الأسبوعي",
  "Top Selling Products": "المنتجات الأكثر مبيعًا",
  "Sort By": "ترتيب حسب",
  Name: "الاسم",
  "Product Name": "اسم المنتج",
  "Total Price": "السعر الإجمالي",
  "Expiry Date": "تاريخ الصلاحية",
  "People / Directory": "العملاء / الدليل",
  "Know who relies on your pharmacy and how you serve them.": "تعرّف على عملائك وكيف تخدمهم.",
  "Add customer": "إضافة عميل",
  "Edit customer": "تعديل العميل",
  "Save customer": "حفظ العميل",
  "Customer name": "اسم العميل",
  Email: "البريد الإلكتروني",
  Phone: "الهاتف",
  Active: "نشط",
  Inactive: "غير نشط",
  "Finance / Ledger": "المالية / السجل",
  "Reconcile incoming money without losing the thread.": "راجع المدفوعات الواردة بسهولة.",
  "Record payment": "تسجيل دفعة",
  Collected: "تم تحصيله",
  Transactions: "المعاملات",
  "Payment ledger": "سجل المدفوعات",
  "All recorded payment activity": "كل عمليات الدفع المسجلة",
  Export: "تصدير",
  Reference: "المرجع",
  Amount: "المبلغ",
  Method: "الطريقة",
  Paid: "مدفوع",
  Failed: "فشل",
  Card: "بطاقة",
  Cash: "نقدًا",
  Insurance: "تأمين",
  Transfer: "تحويل",
  "Insights / Performance": "التحليلات / الأداء",
  "The few numbers worth carrying into your next decision.": "الأرقام المهمة لاتخاذ قرارك القادم.",
  "Download report": "تنزيل التقرير",
  Revenue: "الإيراد",
  "Orders fulfilled": "الطلبات المكتملة",
  "Average order": "متوسط الطلب",
  "Revenue trend": "اتجاه الإيرادات",
  "Revenue by category": "الإيراد حسب التصنيف",
  "Workspace / Preferences": "مساحة العمل / التفضيلات",
  "Make Pharmacy feel like your pharmacy.": "اضبط النظام ليناسب صيدليتك.",
  "Pharmacy details": "بيانات الصيدلية",
  "Pharmacy name": "اسم الصيدلية",
  "Email address": "البريد الإلكتروني",
  "Phone number": "رقم الهاتف",
  Currency: "العملة",
  Address: "العنوان",
  "Operational notifications": "إشعارات التشغيل",
  "Save changes": "حفظ التغييرات",
  "Changes saved": "تم حفظ التغييرات",
  "Workspace health": "حالة النظام",
  "API connection": "اتصال الخادم",
  Connected: "متصل",
  "Data protection": "حماية البيانات",
  "Need a hand?": "تحتاج للمساعدة؟",
  "Contact support": "تواصل مع الدعم",
  "How can we help?": "كيف يمكننا مساعدتك؟",
  "Inventory setup": "إعداد المخزون",
  Integrations: "التكاملات",
  "Staff onboarding": "تهيئة الموظفين",
  "Billing question": "استفسار عن الفواتير",
  "Technical issue": "مشكلة تقنية",
  "Contact email": "بريد التواصل",
  "Tell us what you need": "أخبرنا بما تحتاجه",
  "Describe the issue and what you were trying to do...": "اشرح المشكلة وما الذي كنت تحاول القيام به...",
  "Send request": "إرسال الطلب",
  "Sending...": "جارٍ الإرسال...",
  "Support request failed": "فشل إرسال طلب الدعم",
  "Account / Identity": "الحساب / الهوية",
  "Complete Your Profile to Unlock all Features": "أكمل ملفك الشخصي لفتح جميع المزايا",
  "Profile progress": "تقدم الملف الشخصي",
  Verified: "تم التحقق",
  "Verification pending": "التحقق معلق",
  "Identity details": "بيانات الهوية",
  "Full name": "الاسم بالكامل",
  Role: "الدور",
  "Pharmacy license number": "رقم ترخيص الصيدلية",
  "Save & verify": "حفظ وتحقق",
  "Verification status": "حالة التحقق",
  "Your identity profile is complete.": "بيانات هويتك مكتملة.",
  "Fill every required field to verify.": "املأ جميع الحقول المطلوبة لإتمام التحقق.",
  "Your data stays private": "بياناتك تظل خاصة",
  "Sign in": "تسجيل الدخول",
  "Welcome back": "مرحبًا بعودتك",
  Password: "كلمة المرور",
  "Continue to dashboard": "الدخول إلى لوحة التحكم",
  "This Week": "هذا الأسبوع",
  "This Month": "هذا الشهر",
  "This Year": "هذا العام",
  Yearly: "سنوي",
  "Last 7 days": "آخر 7 أيام",
  "Last 30 days": "آخر 30 يومًا",
  "This quarter": "هذا الربع",
  "All time": "كل الوقت",
  Prev: "السابق",
  Next: "التالي",
  Cancel: "إلغاء",
  Close: "إغلاق",
  "From saved records": "من السجلات المحفوظة",
  "Newest first": "الأحدث أولًا",
  "Oldest first": "الأقدم أولًا",
  "Highest total": "الأعلى قيمة",
  "Lowest total": "الأقل قيمة",
  "Sales exported": "تم تصدير المبيعات",
  "Reports use saved sales and orders.": "تستخدم التقارير بيانات المبيعات والطلبات المحفوظة.",
  "Edit sale": "تعديل عملية البيع",
  "Save sale": "حفظ عملية البيع",
  "Sale updated": "تم تحديث عملية البيع",
  "Sale update failed": "فشل تحديث عملية البيع",
  "Quantity update failed": "فشل تحديث الكمية",
  "Search payments...": "ابحث في المدفوعات...",
  "For all time": "لكل الوقت",
  "Calculated from saved sales records.": "محسوب من سجلات المبيعات المحفوظة.",
  "Sales Revenue": "إيرادات المبيعات",
  "Average Sale": "متوسط عملية البيع",
  "Category contribution": "مساهمة التصنيفات",
  "Category distribution": "توزيع التصنيفات",
  "Where revenue is coming from": "مصادر الإيرادات",
  "Operational readout": "ملخص التشغيل",
  "Reports use reconciled orders and payments.": "تستخدم التقارير الطلبات والمدفوعات المطابقة.",
  "Inventory / Taxonomy": "المخزون / التصنيفات",
  "Organize your catalog and understand which shelves carry the business.": "نظّم الكتالوج واعرف التصنيفات التي تدعم نشاطك.",
  "Performance at a glance": "الأداء في لمحة",
  "Share of catalog by product count": "حصة الكتالوج حسب عدد المنتجات",
  "Customer value": "قيمة العملاء",
  "Total customers": "إجمالي العملاء",
  "Active this month": "النشطون هذا الشهر",
  "All categories": "كل التصنيفات",
  "Pharmacy profile": "ملف الصيدلية",
  "This information appears on receipts and customer communications.": "تظهر هذه المعلومات في الإيصالات ورسائل العملاء.",
  "Get a quiet nudge when stock is low or a payment needs review.": "استلم تنبيهًا عند انخفاض المخزون أو الحاجة لمراجعة دفعة.",
  "Our support team is available for inventory setup, integrations, and staff onboarding.": "فريق الدعم متاح لإعداد المخزون والتكاملات وتهيئة الموظفين.",
  "Used for pharmacy ownership and workspace verification.": "تُستخدم للتحقق من ملكية الصيدلية ومساحة العمل.",
  "Profile information is stored in your local pharmacy workspace and is not shared externally.": "تُحفظ بيانات الملف داخل مساحة عمل الصيدلية ولا تتم مشاركتها خارجيًا.",
  Medicine: "الدواء",
  Contact: "التواصل",
  "Total spent": "إجمالي الإنفاق",
  Share: "الحصة",
  Select: "اختر",
  "Sort By⌄": "ترتيب حسب ⌄",
  Out: "نفد",
  "Pain Relief": "مسكنات الألم",
  Antibiotics: "مضادات حيوية",
  Vitamins: "فيتامينات",
  Children: "أدوية الأطفال",
  Diabetes: "السكري",
  "Digestive Health": "صحة الجهاز الهضمي",
  "Credit Card": "بطاقة ائتمان",
  Wallet: "محفظة إلكترونية",
  "No data for this period": "لا توجد بيانات لهذه الفترة",
};

function translateDynamic(value: string): string {
  const showing = value.match(/^Showing (\d+)-(\d+) of (\d+) entries$/);
  if (showing)
    return `عرض ${showing[1]}-${showing[2]} من ${showing[3]} سجل`;
  if (value.startsWith("Show ")) return `عرض ${value.slice(5)}`;
  const transactions = value.match(/^(\d+) recorded transactions for (.+)\.$/);
  if (transactions) return `${transactions[1]} معاملات مسجلة خلال ${translateDynamic(transactions[2])}.`;
  const points = value.match(/^(\d+) points$/);
  if (points) return `${points[1]} نقاط`;
  const lead = value.match(/^(.+) currently leads revenue at (.+) for (.+)\.$/);
  if (lead) return `${translateDynamic(lead[1])} يتصدر الإيرادات بقيمة ${lead[2]} خلال ${translateDynamic(lead[3])}.`;
  const monthDate = value.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d+)$/);
  if (monthDate) {
    const months: Record<string, string> = { Jan: "ينا", Feb: "فبر", Mar: "مار", Apr: "أبر", May: "ماي", Jun: "يون", Jul: "يول", Aug: "أغس", Sep: "سبت", Oct: "أكت", Nov: "نوف", Dec: "ديس" };
    return `${months[monthDate[1]]} ${monthDate[2]}`;
  }
  return arabic[value] ?? value;
}

type I18nValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (value: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

function TranslationSurface({ language, children }: { language: Language; children: ReactNode }) {
  useLayoutEffect(() => {
    document.documentElement.lang = language === "AR" ? "ar" : "en";
    document.documentElement.dir = language === "AR" ? "rtl" : "ltr";
    if (language !== "AR") return;
    const translateNode = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        const original = root.textContent ?? "";
        const trimmed = original.trim();
        if (!trimmed) return;
        const translated = translateDynamic(trimmed);
        if (translated !== trimmed)
          root.textContent = original.replace(trimmed, translated);
        return;
      }
      if (!(root instanceof HTMLElement) || ["SCRIPT", "STYLE"].includes(root.tagName) || root.closest("[data-no-translate]")) return;
      for (const attribute of ["placeholder", "aria-label", "title"])
        if (root.hasAttribute(attribute)) {
          const value = root.getAttribute(attribute) ?? "";
          root.setAttribute(attribute, translateDynamic(value));
        }
      root.childNodes.forEach(translateNode);
    };
    translateNode(document.body);
    const observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") translateNode(mutation.target);
        mutation.addedNodes.forEach(translateNode);
      }),
    );
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);
  return <div className="contents">{children}</div>;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    localStorage.getItem("pharmacy_language") === "AR" ? "AR" : "EN",
  );
  const value = useMemo<I18nValue>(() => ({
    language,
    setLanguage: (next) => {
      localStorage.setItem("pharmacy_language", next);
      setLanguageState(next);
    },
    t: (text) => language === "AR" ? translateDynamic(text) : text,
  }), [language]);
  return (
    <I18nContext.Provider value={value}>
      <TranslationSurface key={language} language={language}>{children}</TranslationSurface>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
