import Controllers from "./contorlles.model.js";

// CREATE
export const createControl = async (req, res) => {
  try {
    const newControl = new Controllers(req.body);
    const savedControl = await newControl.save();
    res.status(201).json(savedControl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL
export const getAllControls = async (req, res) => {
  try {
    const controls = await Controllers.find();
    res.status(200).json(controls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ONE
export const getControlById = async (req, res) => {
  try {
    const control = await Controllers.findById(req.params.id);

    if (!control) {
      return res.status(404).json({ message: "Control not found" });
    }

    res.status(200).json(control);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateControl = async (req, res) => {
  try {
    const updatedControl = await Controllers.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedControl) {
      return res.status(404).json({ message: "Control not found" });
    }

    res.status(200).json(updatedControl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
export const deleteControl = async (req, res) => {
  try {
    const deletedControl = await Controllers.findByIdAndDelete(req.params.id);

    if (!deletedControl) {
      return res.status(404).json({ message: "Control not found" });
    }

    res.status(200).json({ message: "Control deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};