const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/call.controller");

router.post("/log", auth, controller.logCall);
router.get("/history/:leadId", auth, controller.getCallHistory);

module.exports = router;