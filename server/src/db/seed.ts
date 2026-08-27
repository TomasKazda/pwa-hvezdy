import { db, pool } from "./index.js";
import { families, users, activityTypes, wishes, transactions } from "./schema.js";

async function seed() {
  console.log("Seeding database...");

  const [family] = await db
    .insert(families)
    .values({ name: "Novákovi", code: "DEMO1234", createdBy: null })
    .onConflictDoNothing()
    .returning();

  if (!family) {
    console.log("Seed data already exists, skipping.");
    await pool.end();
    return;
  }

  const [parent] = await db
    .insert(users)
    .values({
      googleId: "seed-parent-001",
      email: "rodic@example.com",
      displayName: "Táta Novák",
      photoUrl: null,
      familyId: family.id,
      role: "parent",
    })
    .returning();

  const [child1] = await db
    .insert(users)
    .values({
      googleId: "seed-child-001",
      email: "petr@example.com",
      displayName: "Petr Novák",
      photoUrl: null,
      familyId: family.id,
      role: "child",
    })
    .returning();

  const [child2] = await db
    .insert(users)
    .values({
      googleId: "seed-child-002",
      email: "anna@example.com",
      displayName: "Anna Nováková",
      photoUrl: null,
      familyId: family.id,
      role: "child",
    })
    .returning();

  await db.execute(`UPDATE families SET created_by = ${parent.id} WHERE id = ${family.id}`);

  const activityRecords = [
    { name: "Úklid", value: 3, direction: "plus" },
    { name: "Škola", value: 5, direction: "plus" },
    { name: "Domácí práce", value: 2, direction: "plus" },
    { name: "Sport", value: 4, direction: "plus" },
    { name: "Chování", value: 1, direction: "plus" },
    { name: "Ztráta", value: 2, direction: "minus" },
  ] as const;

  const insertedActivityTypes = [] as Array<{ id: number; name: string; value: number; direction: string }>;
  for (const item of activityRecords) {
    const [entry] = await db
      .insert(activityTypes)
      .values({
        familyId: family.id,
        name: item.name,
        value: item.value,
        direction: item.direction,
        createdBy: parent.id,
      })
      .returning();
    insertedActivityTypes.push(entry);
  }

  const txData = [
    { childId: child1.id, amount: 3, description: "Vysál obývák" },
    { childId: child1.id, amount: 1, description: "Napsané úkoly" },
    { childId: child1.id, amount: 2, description: "Umyl nádobí" },
    { childId: child1.id, amount: -2, description: "Neuklizený pokoj" },
    { childId: child1.id, amount: 4, description: "Fotbalový trénink" },
    { childId: child1.id, amount: 1, description: "Pomohl sourozenci" },
    { childId: child2.id, amount: 5, description: "Úlohy v Koumákovi" },
    { childId: child2.id, amount: 3, description: "Uklidila koupelnu" },
    { childId: child2.id, amount: 4, description: "Plavecký trénink" },
  ];

  for (const tx of txData) {
    await db.insert(transactions).values({
      familyId: family.id,
      childId: tx.childId,
      amount: tx.amount,
      description: tx.description,
      wishId: null,
      authorId: parent.id,
    });
  }

  await db.insert(wishes).values([
    {
      familyId: family.id,
      title: "Nová hra na PlayStation",
      starCost: 50,
      isPersistent: false,
      isSelfFulfillment: false,
      multiplier: 1,
      createdBy: child1.id,
    },
    {
      familyId: family.id,
      title: "Zmrzlina",
      starCost: 5,
      isPersistent: true,
      isSelfFulfillment: false,
      multiplier: 1,
      createdBy: parent.id,
    },
    {
      familyId: family.id,
      title: "Kino s kamarády",
      starCost: 20,
      isPersistent: false,
      isSelfFulfillment: false,
      multiplier: 1,
      createdBy: child2.id,
    },
    {
      familyId: family.id,
      title: "Nový batoh",
      starCost: 30,
      isPersistent: false,
      isSelfFulfillment: false,
      multiplier: 1,
      createdBy: child1.id,
    },
    {
      familyId: family.id,
      title: "Ponocování do 22:00",
      starCost: 10,
      isPersistent: true,
      isSelfFulfillment: false,
      multiplier: 1,
      createdBy: parent.id,
    },
    {
      familyId: family.id,
      title: "Vlastní sluchátka",
      starCost: null,
      isPersistent: false,
      isSelfFulfillment: false,
      multiplier: 1,
      createdBy: child2.id,
    },
  ]);

  console.log("Seed complete!");
  console.log(`  Family: ${family.name} (code: ${family.code})`);
  console.log(`  Parent: ${parent.displayName} (${parent.email})`);
  console.log(`  Child 1: ${child1.displayName}`);
  console.log(`  Child 2: ${child2.displayName}`);
  console.log(`  Activity types: ${insertedActivityTypes.length}`);
  console.log("  Wishes: 6");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
