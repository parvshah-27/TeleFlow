const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/admin.controller");

router.get("/dashboard-stats", auth, role("Admin"), controller.getDashboardStats);
router.get("/users", auth, role("Admin", "Manager"), controller.getUsers);
router.post("/users", auth, role("Admin", "Manager"), controller.createUser);
router.put("/users/:id", auth, role("Admin", "Manager"), controller.updateUser);
router.delete("/users/:id", auth, role("Admin", "Manager"), controller.deleteUser);
router.get("/telecallers", auth, role("Admin", "Manager"), controller.getTelecallers);
router.get("/global-reports", auth, role("Admin"), controller.getGlobalReports);

module.exports = router;