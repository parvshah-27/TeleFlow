const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/communication.controller");

router.get("/ping", (req, res) => res.json({ msg: "Communication router is working" }));
router.post("/bulk-whatsapp", auth, role("Manager", "Admin", "Telecaller"), controller.sendBulkWhatsApp);
router.post("/bulk-sms", auth, role("Manager", "Admin", "Telecaller"), controller.sendBulkSMS);
router.get("/logs", auth, role("Manager", "Admin", "Telecaller"), controller.getMessageLogs);

module.exports = router;
