/**
 * Seed تکرارپذیر برای محیط توسعه/دمو
 * idempotent: می‌توان چند بار اجرا کرد بدون ایجاد دادهٔ تکراری.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/crypto";

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo@12345";

async function main() {
  console.log("🌱 Seeding (demo) — idempotent ...");

  // 0) Service Groups
  const serviceGroupsData = [
    { code: "emergency", nameFa: "حوادث و اورژانس", sortOrder: 10, description: "حوادث، مسمومیت، تروما و خدمات اورژانس" },
    { code: "visit", nameFa: "ویزیت بیماری واجد شرایط", sortOrder: 20, description: "ویزیت پزشک عمومی برای بیماری‌های واجد شرایط" },
    { code: "lab", nameFa: "آزمایش تشخیصی", sortOrder: 30, description: "آزمایش خون، ادرار، انگل‌شناسی و ..." },
    { code: "imaging", nameFa: "تصویربرداری", sortOrder: 40, description: "رادیولوژی، سونوگرافی" },
    { code: "medication", nameFa: "داروی تجویزشده", sortOrder: 50, description: "داروهای تجویز شده توسط دامپزشک" },
    { code: "surgery", nameFa: "جراحی و بستری", sortOrder: 60, description: "جراحی، بیهوشی و بستری" },
    { code: "specialist", nameFa: "متخصص و تشخیص پیشرفته", sortOrder: 70, description: "ارجاع به متخصص، سی‌تی، آندوسکوپی" },
    { code: "preventive", nameFa: "خدمات پیشگیرانه", sortOrder: 80, description: "واکسن، انگل‌زدایی، چکاپ دوره‌ای" },
  ];

  for (const sg of serviceGroupsData) {
    await prisma.serviceGroup.upsert({
      where: { code: sg.code },
      update: { nameFa: sg.nameFa, description: sg.description, sortOrder: sg.sortOrder, isActive: true },
      create: { code: sg.code, nameFa: sg.nameFa, description: sg.description, sortOrder: sg.sortOrder, isActive: true },
    });
  }
  const groups = await prisma.serviceGroup.findMany();
  const byCode = Object.fromEntries(groups.map((g) => [g.code, g]));

  // 1) Clinics
  const clinicsData = [
    {
      slug: "clinic-mehr-tehran",
      name: "کلینیک دامپزشکی مهر",
      city: "تهران",
      district: "سعادت‌آباد",
      address: "تهران، سعادت‌آباد، خیابان سرو غربی، پلاک ۱۲",
      phone: "021-88000001",
      email: "mehr@demo.local",
      description: "کلینیک تخصصی سگ و گربه با بخش اورژانس ۲۴ساعته (نمونه)",
      latitude: 35.78,
      longitude: 51.37,
      openingHours: { شنبه: "8-21", یکشنبه: "8-21", دوشنبه: "8-21", سه‌شنبه: "8-21", چهارشنبه: "8-21", پنجشنبه: "8-18", جمعه: "10-18" },
      contractStatus: "ACTIVE" as const,
    },
    {
      slug: "clinic-petsina-isfahan",
      name: "کلینیک پت‌سینا",
      city: "اصفهان",
      district: "چهارباغ",
      address: "اصفهان، خیابان چهارباغ عباسی، کوچه ۲۱",
      phone: "031-32200002",
      email: "petsina@demo.local",
      description: "کلینیک مجهز به آزمایشگاه و تصویربرداری",
      openingHours: { شنبه: "9-20", یکشنبه: "9-20", دوشنبه: "9-20", سه‌شنبه: "9-20", چهارشنبه: "9-20", پنجشنبه: "9-17", جمعه: "تعطیل" },
      contractStatus: "ACTIVE" as const,
    },
    {
      slug: "clinic-aria-mashhad",
      name: "کلینیک دامپزشکی آریا",
      city: "مشهد",
      district: "احمدآباد",
      address: "مشهد، احمدآباد، نبش ابوذر ۱۴",
      phone: "051-38000003",
      description: "بخش جراحی و بستری فعال",
      openingHours: { شنبه: "7-23", یکشنبه: "7-23", دوشنبه: "7-23", سه‌شنبه: "7-23", چهارشنبه: "7-23", پنجشنبه: "7-23", جمعه: "7-23" },
      contractStatus: "ACTIVE" as const,
    },
    {
      slug: "clinic-nika-shiraz",
      name: "کلینیک نیکا",
      city: "شیراز",
      district: "معالی‌آباد",
      address: "شیراز، معالی‌آباد، خیابان پزشکان",
      phone: "071-36300004",
      contractStatus: "PENDING" as const,
      description: "در انتظار انعقاد قرارداد (نمونه)",
    },
    {
      slug: "clinic-pars-tabriz",
      name: "کلینیک پارس",
      city: "تبریز",
      district: "ولیعصر",
      address: "تبریز، ولیعصر، خیابان شریعتی",
      phone: "041-33300005",
      contractStatus: "ACTIVE" as const,
      description: "کلینیک دوستدار گربه‌ها",
    },
  ];

  for (const c of clinicsData) {
    const publicId = `CL-${c.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)}`;
    await prisma.clinic.upsert({
      where: { slug: c.slug },
      update: {
        publicId,
        name: c.name,
        city: c.city,
        district: c.district ?? null,
        address: c.address,
        phone: c.phone,
        email: c.email ?? null,
        description: c.description ?? null,
        openingHours: c.openingHours ?? undefined,
        contractStatus: c.contractStatus,
        isDemo: true,
      },
      create: {
        publicId,
        slug: c.slug,
        name: c.name,
        city: c.city,
        district: c.district ?? null,
        address: c.address,
        phone: c.phone,
        email: c.email ?? null,
        description: c.description ?? null,
        latitude: c.latitude ?? null,
        longitude: c.longitude ?? null,
        openingHours: c.openingHours ?? undefined,
        contractStatus: c.contractStatus,
        isDemo: true,
      },
    });
  }

  const clinics = await prisma.clinic.findMany();
  const clinicMehr = clinics.find((c) => c.slug === "clinic-mehr-tehran")!;
  const clinicPetsina = clinics.find((c) => c.slug === "clinic-petsina-isfahan")!;

  // clinic services (همه گروه‌ها برای کلینیک‌های فعال)
  for (const clinic of clinics.filter((c) => c.contractStatus === "ACTIVE")) {
    for (const g of groups) {
      await prisma.clinicService.upsert({
        where: { clinicId_serviceGroupId: { clinicId: clinic.id, serviceGroupId: g.id } },
        update: { isAvailable: true },
        create: { clinicId: clinic.id, serviceGroupId: g.id, isAvailable: true },
      });
    }
  }

  // 2) Plans & PlanVersions
  const plansData = [
    { code: "BASIC", name: "پایه", tagline: "پوشش حوادث و اورژانس", sortOrder: 10 },
    { code: "STANDARD", name: "استاندارد", tagline: "پوشش بیماری‌های واجد شرایط + آزمایش", sortOrder: 20 },
    { code: "COMPLETE", name: "کامل", tagline: "گسترده‌ترین پوشش نمونه", sortOrder: 30 },
  ];
  for (const p of plansData) {
    await prisma.plan.upsert({
      where: { code: p.code },
      update: { name: p.name, tagline: p.tagline, sortOrder: p.sortOrder, isActive: true, isDemo: true },
      create: { code: p.code, name: p.name, tagline: p.tagline, sortOrder: p.sortOrder, isActive: true, isDemo: true },
    });
  }
  const plans = await prisma.plan.findMany();
  const planBasic = plans.find((p) => p.code === "BASIC")!;
  const planStandard = plans.find((p) => p.code === "STANDARD")!;
  const planComplete = plans.find((p) => p.code === "COMPLETE")!;

  // نسخه‌ها: هر طرح یک نسخه منتشرشده نمونه
  const now = new Date();
  const yearAgo = new Date(now); yearAgo.setFullYear(now.getFullYear() - 1);
  const yearLater = new Date(now); yearLater.setFullYear(now.getFullYear() + 1);

  async function ensurePlanVersion(
    planId: string,
    versionCode: string,
    opts: {
      annualLimitRial: number | null;
      deductibleType: "FIXED" | "PERCENT" | "NONE" | "UNSPECIFIED";
      deductibleValue: number | null;
      reimbursementRateBps: number | null;
      waitingPeriodDays: number | null;
    },
    coverage: Record<string, "COVERED" | "NOT_COVERED" | "UNKNOWN">,
  ) {
    let ver = await prisma.planVersion.findUnique({ where: { versionCode } });
    if (!ver) {
      ver = await prisma.planVersion.create({
        data: {
          planId,
          versionCode,
          status: "APPROVED",
          isPublished: true,
          isDemo: true,
          isIllustrative: true,
          effectiveFrom: yearAgo,
          effectiveTo: yearLater,
          annualLimitRial: opts.annualLimitRial,
          deductibleType: opts.deductibleType as never,
          deductibleValue: opts.deductibleValue,
          reimbursementRateBps: opts.reimbursementRateBps,
          waitingPeriodDays: opts.waitingPeriodDays,
          minAgeMonths: 2,
          maxAgeMonths: 180,
          eligibleSpecies: ["DOG", "CAT"] as never,
          termsMarkdown: "این نسخه نمونه و تأییدنشده است. شرایط نهایی توسط بیمه‌گر مجاز تعیین می‌شود.",
          notes: "نمونهٔ آموزشی — پیشنهاد بیمه‌ای نیست",
        },
      });
    } else {
      await prisma.planVersion.update({
        where: { id: ver.id },
        data: {
          status: "APPROVED",
          isPublished: true,
          annualLimitRial: opts.annualLimitRial,
          deductibleType: opts.deductibleType as never,
          deductibleValue: opts.deductibleValue,
          reimbursementRateBps: opts.reimbursementRateBps,
          waitingPeriodDays: opts.waitingPeriodDays,
        },
      });
    }

    // coverage rules
    for (const g of groups) {
      const status = coverage[g.code] ?? "UNKNOWN";
      await prisma.coverageRule.upsert({
        where: { planVersionId_serviceGroupId: { planVersionId: ver.id, serviceGroupId: g.id } },
        update: { coverageStatus: status as never },
        create: { planVersionId: ver.id, serviceGroupId: g.id, coverageStatus: status as never },
      });
    }

    // exclusions
    const exclCount = await prisma.planVersionExclusion.count({ where: { planVersionId: ver.id } });
    if (exclCount === 0) {
      await prisma.planVersionExclusion.createMany({
        data: [
          { planVersionId: ver.id, title: "بیماری‌های از پیش موجود (قبل از شروع بیمه)", sortOrder: 10 },
          { planVersionId: ver.id, title: "واکسیناسیون خارج از برنامه مصوب (در طرح پایه)", sortOrder: 20 },
          { planVersionId: ver.id, title: "جراحی زیبایی", sortOrder: 30 },
        ],
      });
    }
    return ver;
  }

  const pvBasic = await ensurePlanVersion(
    planBasic.id,
    "PV-BASIC-1404-01",
    { annualLimitRial: 50_000_000, deductibleType: "FIXED", deductibleValue: 5_000_000, reimbursementRateBps: 6000, waitingPeriodDays: 14 },
    { emergency: "COVERED", visit: "COVERED", lab: "UNKNOWN", imaging: "NOT_COVERED", medication: "UNKNOWN", surgery: "NOT_COVERED", specialist: "NOT_COVERED", preventive: "NOT_COVERED" },
  );
  const pvStandard = await ensurePlanVersion(
    planStandard.id,
    "PV-STANDARD-1404-01",
    { annualLimitRial: 120_000_000, deductibleType: "PERCENT", deductibleValue: 1000, reimbursementRateBps: 7000, waitingPeriodDays: 14 },
    { emergency: "COVERED", visit: "COVERED", lab: "COVERED", imaging: "COVERED", medication: "COVERED", surgery: "COVERED", specialist: "UNKNOWN", preventive: "NOT_COVERED" },
  );
  const pvComplete = await ensurePlanVersion(
    planComplete.id,
    "PV-COMPLETE-1404-01",
    { annualLimitRial: 250_000_000, deductibleType: "NONE", deductibleValue: null, reimbursementRateBps: 8000, waitingPeriodDays: 7 },
    { emergency: "COVERED", visit: "COVERED", lab: "COVERED", imaging: "COVERED", medication: "COVERED", surgery: "COVERED", specialist: "COVERED", preventive: "COVERED" },
  );

  // 3) Demo users
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  async function ensureUser(data: { email?: string; phone?: string; firstName: string; lastName: string; role: "OWNER" | "CLINIC" | "REVIEWER" | "ADMIN"; clinicId?: string }) {
    const where = data.email ? { email: data.email } : { phone: data.phone! };
    let user = await prisma.user.findFirst({ where });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email ?? null,
          phone: data.phone ?? null,
          firstName: data.firstName,
          lastName: data.lastName,
          passwordHash,
          role: data.role as never,
          status: "ACTIVE",
          clinicId: data.clinicId ?? null,
          isDemo: true,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firstName: data.firstName, lastName: data.lastName, passwordHash, role: data.role as never, clinicId: data.clinicId ?? null, isDemo: true, status: "ACTIVE" },
      });
    }
    return user;
  }

  const owner = await ensureUser({ email: "owner@demo.local", firstName: "علی", lastName: "دمو", role: "OWNER" });
  const owner2 = await ensureUser({ email: "owner2@demo.local", firstName: "سارا", lastName: "نمونه", role: "OWNER" });
  const clinicUser = await ensureUser({ email: "clinic@demo.local", firstName: "کاربر", lastName: "کلینیک مهر", role: "CLINIC", clinicId: clinicMehr.id });
  const clinicUser2 = await ensureUser({ email: "clinic2@demo.local", firstName: "کاربر", lastName: "کلینیک پت‌سینا", role: "CLINIC", clinicId: clinicPetsina.id });
  const reviewer = await ensureUser({ email: "reviewer@demo.local", firstName: "کارشناس", lastName: "بیمه", role: "REVIEWER" });
  const admin = await ensureUser({ email: "admin@demo.local", firstName: "مدیر", lastName: "سامانه", role: "ADMIN" });

  // extra clinic users need clinicId set correctly (upsert may have left old)
  await prisma.user.update({ where: { id: clinicUser.id }, data: { clinicId: clinicMehr.id } });
  await prisma.user.update({ where: { id: clinicUser2.id }, data: { clinicId: clinicPetsina.id } });

  // 4) Pets
  async function ensurePet(ownerId: string, publicId: string, data: { name: string; species: "DOG" | "CAT"; breed?: string; birthDate?: Date }) {
    let pet = await prisma.pet.findUnique({ where: { publicId } });
    if (!pet) {
      pet = await prisma.pet.create({
        data: {
          publicId,
          ownerId,
          name: data.name,
          species: data.species as never,
          breed: data.breed ?? null,
          birthDate: data.birthDate ?? null,
          isDemo: true,
        },
      });
    } else {
      pet = await prisma.pet.update({ where: { id: pet.id }, data: { ownerId, name: data.name, species: data.species as never, breed: data.breed ?? null } });
    }
    return pet;
  }

  const petMilo = await ensurePet(owner.id, "PET-DEMO001", { name: "میلو", species: "DOG", breed: "ژرمن شپرد", birthDate: new Date("2021-03-15") });
  const petLuna = await ensurePet(owner.id, "PET-DEMO002", { name: "لونا", species: "CAT", breed: "پرشین", birthDate: new Date("2022-06-01") });
  const petBobby = await ensurePet(owner2.id, "PET-DEMO003", { name: "بابی", species: "DOG", breed: "هاسکی", birthDate: new Date("2020-11-20") });

  // 5) Policies
  async function ensurePolicy(publicId: string, petId: string, ownerId: string, planId: string, planVersionId: string) {
    let pol = await prisma.policy.findUnique({ where: { publicId } });
    const start = new Date(); start.setMonth(start.getMonth() - 6);
    const end = new Date(); end.setMonth(end.getMonth() + 6);
    if (!pol) {
      pol = await prisma.policy.create({
        data: {
          publicId,
          petId,
          ownerId,
          planId,
          planVersionId,
          status: "ACTIVE",
          startDate: start,
          endDate: end,
          premiumRial: 24_000_000,
          isDemo: true,
        },
      });
    } else {
      pol = await prisma.policy.update({ where: { id: pol.id }, data: { petId, ownerId, planId, planVersionId, status: "ACTIVE" } });
    }
    return pol;
  }

  const polMiloStd = await ensurePolicy("POL-DEMO001", petMilo.id, owner.id, planStandard.id, pvStandard.id);
  const polLunaBasic = await ensurePolicy("POL-DEMO002", petLuna.id, owner.id, planBasic.id, pvBasic.id);
  const polBobbyComplete = await ensurePolicy("POL-DEMO003", petBobby.id, owner2.id, planComplete.id, pvComplete.id);

  // 6) TreatmentRequests — one in each status
  // helper to create request if not exists by trackingCode
  async function ensureRequest(
    trackingCode: string,
    opts: {
      clinicId: string;
      petId: string;
      policyId: string;
      ownerId: string;
      createdById: string;
      status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "NEEDS_CORRECTION" | "APPROVED" | "REJECTED" | "PENDING_SETTLEMENT" | "SETTLED_SIMULATED" | "RESUBMITTED";
      totalAmountRial: number;
      eligibleAmountRial?: number | null;
      insurerShareRial?: number | null;
      ownerShareRial?: number | null;
      lines: { serviceGroupId: string; description: string; quantity: number; unitAmountRial: number; lineTotalRial: number }[];
    },
  ) {
    let existing = await prisma.treatmentRequest.findUnique({ where: { trackingCode } });
    if (existing) return existing;

    const serviceDate = new Date(); serviceDate.setDate(serviceDate.getDate() - Math.floor(Math.random() * 20) - 1);
    const created = await prisma.treatmentRequest.create({
      data: {
        trackingCode,
        clinicId: opts.clinicId,
        petId: opts.petId,
        policyId: opts.policyId,
        ownerId: opts.ownerId,
        createdById: opts.createdById,
        serviceDate,
        totalAmountRial: opts.totalAmountRial,
        eligibleAmountRial: opts.eligibleAmountRial ?? null,
        insurerShareRial: opts.insurerShareRial ?? null,
        ownerShareRial: opts.ownerShareRial ?? null,
        status: opts.status as never,
        submittedAt: ["SUBMITTED", "UNDER_REVIEW", "NEEDS_CORRECTION", "RESUBMITTED", "APPROVED", "REJECTED", "PENDING_SETTLEMENT", "SETTLED_SIMULATED"].includes(opts.status) ? new Date() : null,
        reviewedAt: ["APPROVED", "REJECTED", "PENDING_SETTLEMENT", "SETTLED_SIMULATED"].includes(opts.status) ? new Date() : null,
        decidedAt: ["APPROVED", "REJECTED", "PENDING_SETTLEMENT", "SETTLED_SIMULATED"].includes(opts.status) ? new Date() : null,
        rejectionReason: opts.status === "REJECTED" ? "مدارک ناقص و خدمت خارج از پوشش نسخهٔ نمونه" : null,
        correctionReason: opts.status === "NEEDS_CORRECTION" ? "لطفاً فاکتور خوانا و شرح خدمت را کامل کنید." : null,
      },
    });

    for (let i = 0; i < opts.lines.length; i++) {
      const l = opts.lines[i]!;
      await prisma.serviceLine.create({
        data: {
          requestId: created.id,
          serviceGroupId: l.serviceGroupId,
          description: l.description,
          quantity: l.quantity,
          unitAmountRial: l.unitAmountRial,
          lineTotalRial: l.lineTotalRial,
          sortOrder: i,
        },
      });
    }

    await prisma.requestStatusEvent.create({
      data: {
        requestId: created.id,
        fromStatus: null,
        toStatus: "DRAFT" as never,
        actorId: opts.createdById,
        actorRole: "CLINIC" as never,
        note: "ایجاد پیش‌نویس (seed)",
      },
    });
    if (opts.status !== "DRAFT") {
      await prisma.requestStatusEvent.create({
        data: {
          requestId: created.id,
          fromStatus: "DRAFT" as never,
          toStatus: opts.status as never,
          actorId: opts.status === "APPROVED" || opts.status === "REJECTED" || opts.status === "PENDING_SETTLEMENT" || opts.status === "SETTLED_SIMULATED" ? reviewer.id : opts.createdById,
          actorRole: ["APPROVED", "REJECTED", "PENDING_SETTLEMENT", "SETTLED_SIMULATED", "UNDER_REVIEW"].includes(opts.status) ? ("REVIEWER" as never) : ("CLINIC" as never),
          note: `تغییر وضعیت به ${opts.status} (seed)`,
        },
      });
    }

    // sample decision for approved/rejected
    if (["APPROVED", "REJECTED", "PENDING_SETTLEMENT", "SETTLED_SIMULATED"].includes(opts.status)) {
      await prisma.reviewDecision.create({
        data: {
          requestId: created.id,
          reviewerId: reviewer.id,
          decision: opts.status === "REJECTED" ? ("REJECT" as never) : opts.status === "APPROVED" || opts.status === "PENDING_SETTLEMENT" || opts.status === "SETTLED_SIMULATED" ? ("APPROVE" as never) : ("REQUEST_CORRECTION" as never),
          reason: opts.status === "REJECTED" ? "خدمت خارج از پوشش" : "تأیید شده بر اساس نسخهٔ نمونه",
          before: { status: "UNDER_REVIEW" } as never,
          after: { status: opts.status } as never,
          eligibleAmountRial: opts.eligibleAmountRial ?? null,
          insurerShareRial: opts.insurerShareRial ?? null,
          ownerShareRial: opts.ownerShareRial ?? null,
        },
      });
    }

    // settlement for SETTLED_SIMULATED
    if (opts.status === "SETTLED_SIMULATED") {
      await prisma.settlement.create({
        data: {
          requestId: created.id,
          clinicId: opts.clinicId,
          amountRial: opts.insurerShareRial ?? 0,
          mode: "SIMULATED",
          reference: `DEMO-${trackingCode}`,
          settledAt: new Date(),
          note: "تسویه آزمایشی (seed) — پرداخت واقعی نیست",
          createdById: reviewer.id,
        },
      });
      await prisma.treatmentRequest.update({ where: { id: created.id }, data: { settledAt: new Date() } });
    }

    return created;
  }

  const gVisit = byCode["visit"]!.id;
  const gLab = byCode["lab"]!.id;
  const gSurgery = byCode["surgery"]!.id;
  const gPreventive = byCode["preventive"]!.id;

  await ensureRequest("TR-DEMO0001", {
    clinicId: clinicMehr.id,
    petId: petMilo.id,
    policyId: polMiloStd.id,
    ownerId: owner.id,
    createdById: clinicUser.id,
    status: "SUBMITTED",
    totalAmountRial: 8_000_000,
    lines: [
      { serviceGroupId: gVisit, description: "ویزیت عمومی", quantity: 1, unitAmountRial: 3_000_000, lineTotalRial: 3_000_000 },
      { serviceGroupId: gLab, description: "آزمایش خون", quantity: 1, unitAmountRial: 5_000_000, lineTotalRial: 5_000_000 },
    ],
  });

  await ensureRequest("TR-DEMO0002", {
    clinicId: clinicMehr.id,
    petId: petLuna.id,
    policyId: polLunaBasic.id,
    ownerId: owner.id,
    createdById: clinicUser.id,
    status: "UNDER_REVIEW",
    totalAmountRial: 12_000_000,
    lines: [
      { serviceGroupId: gVisit, description: "ویزیت اورژانس", quantity: 1, unitAmountRial: 4_000_000, lineTotalRial: 4_000_000 },
      { serviceGroupId: gSurgery, description: "بخیه و پانسمان", quantity: 1, unitAmountRial: 8_000_000, lineTotalRial: 8_000_000 },
    ],
  });

  await ensureRequest("TR-DEMO0003", {
    clinicId: clinicPetsina.id,
    petId: petBobby.id,
    policyId: polBobbyComplete.id,
    ownerId: owner2.id,
    createdById: clinicUser2.id,
    status: "NEEDS_CORRECTION",
    totalAmountRial: 6_000_000,
    lines: [{ serviceGroupId: gLab, description: "آزمایش انگل", quantity: 1, unitAmountRial: 6_000_000, lineTotalRial: 6_000_000 }],
  });

  await ensureRequest("TR-DEMO0004", {
    clinicId: clinicMehr.id,
    petId: petMilo.id,
    policyId: polMiloStd.id,
    ownerId: owner.id,
    createdById: clinicUser.id,
    status: "APPROVED",
    totalAmountRial: 20_000_000,
    eligibleAmountRial: 18_000_000,
    insurerShareRial: 12_600_000,
    ownerShareRial: 5_400_000,
    lines: [
      { serviceGroupId: gSurgery, description: "جراحی سرپایی", quantity: 1, unitAmountRial: 20_000_000, lineTotalRial: 20_000_000 },
    ],
  });

  await ensureRequest("TR-DEMO0005", {
    clinicId: clinicMehr.id,
    petId: petMilo.id,
    policyId: polMiloStd.id,
    ownerId: owner.id,
    createdById: clinicUser.id,
    status: "REJECTED",
    totalAmountRial: 5_000_000,
    lines: [{ serviceGroupId: gPreventive, description: "واکسن سالانه (خارج از پوشش پایه)", quantity: 1, unitAmountRial: 5_000_000, lineTotalRial: 5_000_000 }],
  });

  await ensureRequest("TR-DEMO0006", {
    clinicId: clinicPetsina.id,
    petId: petBobby.id,
    policyId: polBobbyComplete.id,
    ownerId: owner2.id,
    createdById: clinicUser2.id,
    status: "PENDING_SETTLEMENT",
    totalAmountRial: 15_000_000,
    eligibleAmountRial: 15_000_000,
    insurerShareRial: 10_500_000,
    ownerShareRial: 4_500_000,
    lines: [{ serviceGroupId: gLab, description: "سونوگرافی", quantity: 1, unitAmountRial: 15_000_000, lineTotalRial: 15_000_000 }],
  });

  await ensureRequest("TR-DEMO0007", {
    clinicId: clinicMehr.id,
    petId: petLuna.id,
    policyId: polLunaBasic.id,
    ownerId: owner.id,
    createdById: clinicUser.id,
    status: "SETTLED_SIMULATED",
    totalAmountRial: 9_000_000,
    eligibleAmountRial: 8_000_000,
    insurerShareRial: 4_800_000,
    ownerShareRial: 3_200_000,
    lines: [{ serviceGroupId: gVisit, description: "ویزیت + دارو", quantity: 1, unitAmountRial: 9_000_000, lineTotalRial: 9_000_000 }],
  });

  // Pricing assumptions
  await prisma.pricingAssumption.upsert({
    where: { id: "pricing-demo-1" },
    update: {},
    create: {
      id: "pricing-demo-1",
      code: "LAB-DOG-01",
      name: "آزمایش خون سگ — میانگین",
      species: "DOG",
      serviceGroupId: byCode["lab"]!.id,
      avgCostRial: 4_500_000,
      annualFrequency: 0.6,
      insurerPayShareBps: 7000,
      source: "برآورد نمونه داخلی",
      estimatedAt: new Date(),
      status: "PROPOSED",
      notes: "نمونهٔ آموزشی",
      createdById: admin.id,
    },
  });

  console.log("✅ Seed completed");
  console.log(`   Demo users: owner@demo.local / clinic@demo.local / reviewer@demo.local / admin@demo.local (password: ${DEMO_PASSWORD})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
