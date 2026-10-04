const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const app = require("../app");
const User = require("../models/user");
const Machine = require("../models/machine");
const Report = require("../models/report");

// Test database connection - use a dedicated test database
// Always use localhost to avoid Docker container name resolution issues
const mongoUri = "mongodb://localhost:27017/maintenance-test";

// Helper to create a test user directly in the database
const createTestUser = async (email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: "Test User",
    email: email.toLowerCase(),
    password: hashedPassword,
  });
  return user;
};

// Helper to generate a JWT for a user (uses app's JWT secret)
const jwt = require("jsonwebtoken");
const generateTestToken = (userId) => {
  return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

beforeAll(async () => {
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clear all collections before each test
  await User.deleteMany({});
  await Machine.deleteMany({});
  await Report.deleteMany({});
});

let authToken;
let userId;
let machineId;
let reportId;

// ===== AUTHENTICATION TESTS =====

describe("Authentication", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test("should login successfully", async () => {
    // Create user directly in DB
    const user = await createTestUser("login@example.com", "Password123!");

    // Then login
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@example.com",
        password: "Password123!",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.token).toBeTruthy();
    authToken = response.body.token;
    userId = response.body.user.id;
    expect(response.body.user.email).toBe("login@example.com");
  });

  test("should fail login with wrong password", async () => {
    await createTestUser("wrongpass@example.com", "Password123!");

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrongpass@example.com",
        password: "WrongPassword",
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  test("should reject request without JWT token", async () => {
    const response = await request(app)
      .get("/api/machines");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  test("should reject invalid JWT token", async () => {
    const response = await request(app)
      .get("/api/machines")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });
});

// ===== USER PROFILE TESTS =====

describe("User Profile", () => {
  let token;
  let userId;

  beforeEach(async () => {
    await User.deleteMany({});
    // Create a user directly in DB
    const user = await createTestUser("profile@example.com", "Password123!");
    userId = user._id.toString();
    // Generate a valid JWT for the user
    token = generateTestToken(user._id);
  });

  test("should get own profile", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name");
    expect(response.body).toHaveProperty("email");
    expect(response.body).not.toHaveProperty("password");
  });

  test("should update own profile name", async () => {
    const response = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Name",
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Updated Name");
  });

  test("should update own profile email", async () => {
    const response = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "newemail@example.com",
      });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe("newemail@example.com");
  });

  test("should hash password when updated", async () => {
    const response = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        password: "NewPassword123!",
      });

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty("password");

    // Try to login with new password
    const user = await User.findById(userId);
    expect(user.password).not.toBe("NewPassword123!");
  });

  test("should reject duplicate email on profile update", async () => {
    // Create another user directly in DB
    await createTestUser("another@example.com", "Password123!");

    // Try to update to that email
    const response = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "another@example.com",
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Email already exists");
  });

  test("should require at least one field to update profile", async () => {
    const response = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });
});

// ===== MACHINE TESTS =====

describe("Machine Management", () => {
  let token;
  let testUserId;

  beforeEach(async () => {
    await User.deleteMany({});
    // Create user directly in DB
    const user = await createTestUser(`machineuser${Date.now()}@example.com`, "Password123!");
    testUserId = user._id;
    // Generate a valid JWT for the user
    token = generateTestToken(user._id);
  });

  test("should create a machine", async () => {
    const response = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH001",
        name: "Assembly Machine",
        workshop: "Workshop A",
        status: "disponible",
      });

    expect(response.status).toBe(201);
    expect(response.body.machine).toHaveProperty("_id");
    expect(response.body.machine.status).toBe("disponible");
  });

  test("should reject duplicate machine reference", async () => {
    await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH002",
        name: "Machine A",
        workshop: "Workshop A",
        status: "disponible",
      });

    const response = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH002",
        name: "Machine B",
        workshop: "Workshop B",
        status: "disponible",
      });

    expect(response.status).toBe(409);
  });

  test("should reject invalid machine status", async () => {
    const response = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH003",
        name: "Machine",
        workshop: "Workshop A",
        status: "invalid_status",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("disponible");
    expect(response.body.message).toContain("maintenance");
    expect(response.body.message).toContain("hors_service");
  });

  test("should filter machines by workshop", async () => {
    await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH004",
        name: "Workshop A Machine",
        workshop: "Workshop A",
        status: "disponible",
      });

    await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH005",
        name: "Workshop B Machine",
        workshop: "Workshop B",
        status: "disponible",
      });

    const response = await request(app)
      .get("/api/machines?workshop=Workshop A")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.machines.length).toBe(1);
    expect(response.body.machines[0].workshop).toBe("Workshop A");
  });

  test("should filter machines by status", async () => {
    await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH006",
        name: "Available Machine",
        workshop: "Workshop A",
        status: "disponible",
      });

    await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH007",
        name: "Maintenance Machine",
        workshop: "Workshop A",
        status: "maintenance",
      });

    const response = await request(app)
      .get("/api/machines?status=disponible")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.machines.length).toBe(1);
    expect(response.body.machines[0].status).toBe("disponible");
  });

  test("should get machine details", async () => {
    const createRes = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH008",
        name: "Test Machine",
        workshop: "Workshop A",
        status: "disponible",
      });

    const id = createRes.body.machine._id;

    const response = await request(app)
      .get(`/api/machines/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.machine._id).toBe(id);
  });

  test("should update machine", async () => {
    const createRes = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH009",
        name: "Original Name",
        workshop: "Workshop A",
        status: "disponible",
      });

    const id = createRes.body.machine._id;

    const response = await request(app)
      .put(`/api/machines/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Name",
        status: "maintenance",
      });

    expect(response.status).toBe(200);
    expect(response.body.machine.name).toBe("Updated Name");
    expect(response.body.machine.status).toBe("maintenance");
  });

  test("should delete machine without reports", async () => {
    const createRes = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH010",
        name: "Machine to Delete",
        workshop: "Workshop A",
        status: "disponible",
      });

    const id = createRes.body.machine._id;

    const response = await request(app)
      .delete(`/api/machines/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Machine deleted successfully");
  });

  test("should reject deletion of machine with reports", async () => {
    const machineRes = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH011",
        name: "Machine with Reports",
        workshop: "Workshop A",
        status: "disponible",
      });

    const machId = machineRes.body.machine._id;

    // Create a report for this machine
    await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machId,
        description: "Machine is broken",
      });

    const response = await request(app)
      .delete(`/api/machines/${machId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Cannot delete machine with existing reports");
    expect(response.body.reportCount).toBe(1);
  });

  test("should get machine report history", async () => {
    const machineRes = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: "MACH012",
        name: "Machine for History",
        workshop: "Workshop A",
        status: "disponible",
      });

    const machId = machineRes.body.machine._id;

    await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machId,
        description: "First Report",
      });

    await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machId,
        description: "Second Report",
      });

    const response = await request(app)
      .get(`/api/machines/${machId}/reports`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.reports.length).toBe(2);
  });
});

// ===== REPORT TESTS =====

describe("Report Management", () => {
  let token;
  let machineId;

  beforeEach(async () => {
    // Create user directly in DB
    const email = `reportuser${Date.now()}@example.com`;
    const user = await createTestUser(email, "Password123!");
    // Generate a valid JWT for the user
    token = generateTestToken(user._id);

    const machRes = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: `MACH-${Date.now()}`,
        name: "Test Machine",
        workshop: "Workshop A",
        status: "disponible",
      });
    machineId = machRes.body.machine._id;
  });

  test("should create a report", async () => {
    const response = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId,
        description: "Machine is not starting",
      });

    expect(response.status).toBe(201);
    expect(response.body.report).toHaveProperty("_id");
    expect(response.body.report.status).toBe("ouvert");
    expect(response.body.report.reportedBy).toBeTruthy();
  });

  test("should reject report with non-existing machine", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: fakeId.toString(),
        description: "Test report",
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Machine not found");
  });

  test("should reject report with empty description", async () => {
    const response = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId,
        description: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("description is required");
  });

  test("should filter reports by machine", async () => {
    const mach2Res = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reference: `MACH2-${Date.now()}`,
        name: "Another Machine",
        workshop: "Workshop B",
        status: "disponible",
      });

    const machineId2 = mach2Res.body.machine._id;

    await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId,
        description: "Report 1",
      });

    await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId2,
        description: "Report 2",
      });

    const response = await request(app)
      .get(`/api/reports?machine=${machineId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.reports.length).toBe(1);
    expect(response.body.reports[0].machine).toBe(machineId);
  });

  test("should filter reports by status", async () => {
    await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId,
        description: "Report A",
      });

    const reportBRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId,
        description: "Report B",
      });

    // Change Report B to en_cours
    await request(app)
      .patch(`/api/reports/${reportBRes.body.report._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "en_cours",
      });

    const response = await request(app)
      .get("/api/reports?status=ouvert")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.reports.every(r => r.status === "ouvert")).toBe(true);
  });

  test("should update report status", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId,
        description: "Test Report",
      });

    const response = await request(app)
      .patch(`/api/reports/${reportRes.body.report._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "en_cours",
      });

    expect(response.status).toBe(200);
    expect(response.body.report.status).toBe("en_cours");
  });

  test("should reject resolving without resolution note", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId,
        description: "Test Report",
      });

    const response = await request(app)
      .patch(`/api/reports/${reportRes.body.report._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "résolu",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("resolutionNote is required");
  });

  test("should resolve report with resolution note", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId,
        description: "Test Report",
      });

    const response = await request(app)
      .patch(`/api/reports/${reportRes.body.report._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "résolu",
        resolutionNote: "Machine was repaired",
      });

    expect(response.status).toBe(200);
    expect(response.body.report.status).toBe("résolu");
    expect(response.body.report.resolutionNote).toBe("Machine was repaired");
    expect(response.body.report.resolvedAt).toBeTruthy();
  });

  test("should set resolution date when resolved", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId,
        description: "Test Report",
      });

    const response = await request(app)
      .patch(`/api/reports/${reportRes.body.report._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "résolu",
        resolutionNote: "Fixed",
      });

    expect(response.body.report.resolvedAt).toBeTruthy();
    const resolvedDate = new Date(response.body.report.resolvedAt);
    expect(resolvedDate).toBeInstanceOf(Date);
  });

  test("should clear resolution date when reopened", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId,
        description: "Test Report",
      });

    // Resolve it
    await request(app)
      .patch(`/api/reports/${reportRes.body.report._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "résolu",
        resolutionNote: "Fixed",
      });

    // Reopen it
    const response = await request(app)
      .patch(`/api/reports/${reportRes.body.report._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "en_cours",
      });

    expect(response.body.report.resolvedAt).toBe(null);
  });

  test("should reject invalid status", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId: machineId,
        description: "Test Report",
      });

    const response = await request(app)
      .patch(`/api/reports/${reportRes.body.report._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "invalid_status",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("ouvert");
    expect(response.body.message).toContain("en_cours");
    expect(response.body.message).toContain("résolu");
  });
});
