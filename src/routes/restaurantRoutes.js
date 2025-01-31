const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");
const auth = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

// Toutes les routes sont protégées par le middleware auth
router.use(auth);

// Routes CRUD
router.post("/", restaurantController.createRestaurant);
router.get("/", restaurantController.getRestaurants);
router.get("/:id", restaurantController.getRestaurant);
router.put("/:id", restaurantController.updateRestaurant);
router.delete("/:id", restaurantController.deleteRestaurant);

// Upload d'images
router.post(
  "/:id/images",
  auth,
  upload.array("images", 5),
  restaurantController.uploadImages
);
router.delete("/:id/images/:imageId", auth, restaurantController.deleteImage);

// Gestion des avis
router.post("/:id/avis", auth, restaurantController.addAvis);
router.put("/:id/avis/:avisId", auth, restaurantController.updateAvis);
router.delete("/:id/avis/:avisId", auth, restaurantController.deleteAvis);

module.exports = router;
