const Restaurant = require("../models/Restaurant");
const { cloudinary } = require("../config/cloudinary");

// Créer un restaurant
exports.createRestaurant = async (req, res) => {
  try {
    const restaurant = new Restaurant({
      ...req.body,
      userId: req.user._id,
    });

    await restaurant.save();
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fonction utilitaire pour construire le filtre de recherche
const buildSearchFilter = (query, userId) => {
  const filter = { userId };

  if (query.search) {
    filter.$or = [
      { nom: { $regex: query.search, $options: "i" } },
      { cuisine: { $regex: query.search, $options: "i" } },
      { "adresse.ville": { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.cuisine) {
    filter.cuisine = { $regex: query.cuisine, $options: "i" };
  }

  if (query.ville) {
    filter["adresse.ville"] = { $regex: query.ville, $options: "i" };
  }

  if (query.noteMin) {
    filter.note = { $gte: parseInt(query.noteMin) };
  }

  return filter;
};

// Mettre à jour la fonction getRestaurants pour inclure recherche et pagination
exports.getRestaurants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = buildSearchFilter(req.query, req.user._id);

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter)
        .sort({ [req.query.sortBy || "createdAt"]: req.query.order || "desc" })
        .skip(skip)
        .limit(limit),
      Restaurant.countDocuments(filter),
    ]);

    res.json({
      restaurants,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir un restaurant spécifique
exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé" });
    }

    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé" });
    }

    res.json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer un restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé" });
    }

    res.json({ message: "Restaurant supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload d'images
exports.uploadImages = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé" });
    }

    const images = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));

    restaurant.images.push(...images);
    await restaurant.save();

    res.json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Gestion des avis
exports.addAvis = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé" });
    }

    // Vérifier si l'utilisateur a déjà donné son avis
    const avisExistant = restaurant.avis.find(
      (avis) => avis.userId.toString() === req.user._id.toString()
    );

    if (avisExistant) {
      return res
        .status(400)
        .json({ message: "Vous avez déjà donné votre avis" });
    }

    restaurant.avis.push({
      userId: req.user._id,
      note: req.body.note,
      commentaire: req.body.commentaire,
    });

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer une image
exports.deleteImage = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé" });
    }

    // Chercher l'image par _id ou public_id
    const imageIndex = restaurant.images.findIndex(
      (img) =>
        img._id.toString() === req.params.imageId ||
        img.public_id === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ message: "Image non trouvée" });
    }

    // Récupérer le public_id pour Cloudinary
    const publicId = restaurant.images[imageIndex].public_id;

    // Supprimer l'image de Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Supprimer l'image du restaurant
    restaurant.images.splice(imageIndex, 1);
    await restaurant.save();

    res.json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mettre à jour un avis
exports.updateAvis = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé" });
    }

    const avis = restaurant.avis.id(req.params.avisId);

    if (!avis) {
      return res.status(404).json({ message: "Avis non trouvé" });
    }

    // Vérifier que l'utilisateur est le propriétaire de l'avis
    if (avis.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    avis.note = req.body.note || avis.note;
    avis.commentaire = req.body.commentaire || avis.commentaire;

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer un avis
exports.deleteAvis = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé" });
    }

    // Trouver l'index de l'avis
    const avisIndex = restaurant.avis.findIndex(
      (avis) => avis._id.toString() === req.params.avisId
    );

    if (avisIndex === -1) {
      return res.status(404).json({ message: "Avis non trouvé" });
    }

    // Vérifier que l'utilisateur est le propriétaire de l'avis
    if (
      restaurant.avis[avisIndex].userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    // Supprimer l'avis en utilisant pull
    restaurant.avis.pull({ _id: req.params.avisId });
    await restaurant.save();

    res.json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
