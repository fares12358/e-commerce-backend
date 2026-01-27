import User from './user.model.js';

/* ================= GET MY LOCATIONS ================= */
export const getMyLocations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('locations');

    return res.status(200).json({
      success: true,
      message: 'تم جلب العناوين بنجاح',
      data: user.locations || []
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب العناوين'
    });
  }
};

/* ================= ADD LOCATION ================= */
export const addLocation = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.locations.push(req.body);
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'تمت إضافة العنوان بنجاح',
      data: user.locations
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة العنوان'
    });
  }
};

/* ================= UPDATE LOCATION ================= */
export const updateLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    const user = await User.findOne({
      _id: req.user._id,
      'locations._id': locationId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'العنوان غير موجود'
      });
    }

    const location = user.locations.id(locationId);

    Object.keys(req.body).forEach(key => {
      location[key] = req.body[key];
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'تم تحديث العنوان بنجاح',
      data: location
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث العنوان'
    });
  }
};

/* ================= DELETE LOCATION ================= */
export const deleteLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    const user = await User.findById(req.user._id);

    user.locations = user.locations.filter(
      loc => loc._id.toString() !== locationId
    );

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'تم حذف العنوان بنجاح'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف العنوان'
    });
  }
};
