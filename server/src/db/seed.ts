import { db, pool } from "./index.js";
import { families, users, activityTypes, wishes, transactions } from "./schema.js";

async function seed() {
  console.log("Seeding database...");

  // 1. Create a demo family
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

  // 2. Create demo users
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

  // Update family createdBy
  await db.execute(
    /*sql*/ `UPDATE families SET created_by = ${parent.id} WHERE id = ${family.id}`
  );

  // 3. Create activity types (categories)
  const [catUklid] = await db
    .insert(activityTypes)
    .values({ familyId: family.id, name: "Úklid", defaultStars: 3 })
    .returning();

  const [catSkola] = await db
    .insert(activityTypes)
    .values({ familyId: family.id, name: "Škola", defaultStars: 5 })
    .returning();

  const [catDomaci] = await db
    .insert(activityTypes)
    .values({ familyId: family.id, name: "Domácí práce", defaultStars: 2 })
    .returning();

  const [catSport] = await db
    .insert(activityTypes)
    .values({ familyId: family.id, name: "Sport", defaultStars: 4 })
    .returning();

  const [catChovani] = await db
    .insert(activityTypes)
    .values({ familyId: family.id, name: "Chování", defaultStars: 1 })
    .returning();

  // 4. Create transactions (star history for child1)
  const txData = [
    { childId: child1.id, amount: 3, description: "Vysál obývák", categoryId: catUklid.id },
    { childId: child1.id, amount: 1, description: "Napsané úkoly", categoryId: catSkola.id },
    { childId: child1.id, amount: 2, description: "Umyl nádobí", categoryId: catDomaci.id },
    { childId: child1.id, amount: -2, description: "Neuklizený pokoj", categoryId: catUklid.id },
    { childId: child1.id, amount: 4, description: "Fotbalový trénink", categoryId: catSport.id },
    { childId: child1.id, amount: 1, description: "Pomohl sourozenci", categoryId: catChovani.id },
    { childId: child2.id, amount: 5, description: "Úlohy v Koumákovi", categoryId: catSkola.id },
    { childId: child2.id, amount: 3, description: "Uklidila koupelnu", categoryId: catUklid.id },
    { childId: child2.id, amount: 4, description: "Plavecký trénink", categoryId: catSport.id },
  ];

  for (const tx of txData) {
    await db.insert(transactions).values({
      familyId: family.id,
      childId: tx.childId,
      amount: tx.amount,
      description: tx.description,
      categoryId: tx.categoryId,
      authorId: parent.id,
    });
  }

  // 5. Create wishes
  await db.insert(wishes).values([
    {
      familyId: family.id,
      title: "Nová hra na PlayStation",
      starCost: 50,
      isPersistent: false,
      createdBy: child1.id,
    },
    {
      familyId: family.id,
      title: "Zmrzlina",
      starCost: 5,
      isPersistent: true,
      createdBy: parent.id,
    },
    {
      familyId: family.id,
      title: "Kino s kamarády",
      starCost: 20,
      isPersistent: false,
      createdBy: child2.id,
    },
    {
      familyId: family.id,
      title: "Nový batoh",
      starCost: 30,
      isPersistent: false,
      createdBy: child1.id,
    },
    {
      familyId: family.id,
      title: "Ponocování do 22:00",
      starCost: 10,
      isPersistent: true,
      createdBy: parent.id,
    },
    {
      familyId: family.id,
      title: "Vlastní sluchátka",
      starCost: null, // not priced yet
      isPersistent: false,
      createdBy: child2.id,
    },
  ]);

  console.log("Seed complete!");
  console.log(`  Family: ${family.name} (code: ${family.code})`);
  console.log(`  Parent: ${parent.displayName} (${parent.email})`);
  console.log(`  Child 1: ${child1.displayName} — balance: 13 ⭐`);
  console.log(`  Child 2: ${child2.displayName} — balance: 12 ⭐`);
  console.log(`  Activity types: 5`);
  console.log(`  Wishes: 6 (1 unpriced)`);

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
