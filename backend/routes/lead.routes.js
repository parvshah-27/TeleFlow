const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/lead.controller");
const path = require("path");

const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /csv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.originalname.endsWith('.csv');

    if (extname || mimetype) {
        return cb(null, true);
    } else {
        cb(new Error("Only CSV files are allowed!"));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

router.post("/import", auth, role("Manager", "Admin"), upload.single("file"), controller.importLeads);
router.get("/unassigned", auth, role("Manager"), controller.getUnassignedLeads);
router.get("/assigned", auth, role("Manager"), controller.getAssignedLeads);
router.get("/manager-dashboard-stats", auth, role("Manager"), controller.getManagerDashboardStats);
router.get("/dashboard-stats", auth, role("Telecaller"), controller.getDashboardStats);
router.get("/performance-insights", auth, role("Telecaller"), controller.getPerformanceInsights);
router.get("/completed", auth, role("Manager"), controller.getCompletedLeads);
router.post("/", auth, role("Manager", "Admin"), controller.createLead);
router.get("/", auth, role("Manager", "Admin"), controller.getAllLeads);
router.get("/my", auth, role("Telecaller"), controller.getMyLeads);
router.post("/assign", auth, role("Manager"), controller.assignLead);
router.post("/bulk-assign", auth, role("Manager"), controller.bulkAssign);
router.put("/:id", auth, controller.updateLead); // role check inside controller
router.delete("/:id", auth, role("Manager", "Admin"), controller.deleteLead);
router.get("/for-verification", auth, role("Manager"), controller.getLeadsForVerification);
router.put("/verify/:id", auth, role("Manager"), controller.verifyLead);


module.exports = router;
