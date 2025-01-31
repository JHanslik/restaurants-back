const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },
    cuisine: {
      type: String,
      required: [true, "Le type de cuisine est requis"],
      trim: true,
    },
    adresse: {
      rue: {
        type: String,
        required: [true, "L'adresse est requise"],
      },
      ville: {
        type: String,
        required: [true, "La ville est requise"],
      },
      codePostal: {
        type: String,
        required: [true, "Le code postal est requis"],
      },
    },
    telephone: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    avis: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        note: {
          type: Number,
          required: true,
          min: 0,
          max: 5,
        },
        commentaire: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    noteMoyenne: {
      type: Number,
      default: 0,
    },
    nombreAvis: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware pour calculer la note moyenne
restaurantSchema.pre("save", function (next) {
  if (this.avis && this.avis.length > 0) {
    const sommeNotes = this.avis.reduce((acc, avis) => acc + avis.note, 0);
    this.noteMoyenne = parseFloat((sommeNotes / this.avis.length).toFixed(1));
    this.nombreAvis = this.avis.length;
  } else {
    this.noteMoyenne = 0;
    this.nombreAvis = 0;
  }
  next();
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
