const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/script.controller");

router.use(auth);

router.get("/", controller.getScripts);
router.get("/analytics", role("Manager", "Admin"), controller.getAnalytics);
router.get("/feed", role("Manager", "Admin"), controller.getActivityFeed);
router.post("/", role("Manager", "Admin"), controller.createScript);
router.put("/:id", role("Manager", "Admin"), controller.updateScript);
router.delete("/:id", role("Manager", "Admin"), controller.deleteScript);

module.exports = router;
