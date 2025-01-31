const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");
const auth = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

// Routes publiques
router.get("/", restaurantController.getRestaurants);
router.get("/:id", restaurantController.getRestaurant);

// Routes protégées
router.use(auth);

// Routes CRUD nécessitant une authentification
router.post("/", restaurantController.createRestaurant);
router.put("/:id", restaurantController.updateRestaurant);
router.delete("/:id", restaurantController.deleteRestaurant);

// Upload d'images
router.post(
  "/:id/images",
  upload.array("images", 5),
  restaurantController.uploadImages
);
router.delete("/:id/images/:imageId", restaurantController.deleteImage);

// Gestion des avis
router.post("/:id/avis", restaurantController.addAvis);
router.put("/:id/avis/:avisId", restaurantController.updateAvis);
router.delete("/:id/avis/:avisId", restaurantController.deleteAvis);

module.exports = router;
