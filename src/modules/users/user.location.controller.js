import User from './user.model.js';

/* ================= GET MY LOCATIONS ================= */
export const getMyLocations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

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
    const {
      locationDescription,
      country,
      city,
      government,
      locationLink,
      strName,
      phone,
    } = req.body;

    // ✅ Validation
    if (
      !locationDescription ||
      !country ||
      !city ||
      !government ||
      !phone
    ) {
      return res.status(400).json({
        success: false,
        message: "جميع الحقول المطلوبة يجب إدخالها",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }
    const isFirstLocation = user.locations.length === 0;
    
    const newLocation = {
      locationDescription: locationDescription.trim(),
      country,
      city,
      government,
      locationLink: locationLink || "",
      strName: strName || "",
      phone,
      default: isFirstLocation ? true : false,
    };

    user.locations.push(newLocation);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "تمت إضافة العنوان بنجاح",
      data: user.locations,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إضافة العنوان",
    });
  }
};

/* ================= DELETE LOCATION ================= */
export const deleteLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    const user = await User.findById(req.user._id);

    const location = user.locations.id(locationId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "العنوان غير موجود",
      });
    }

    location.deleteOne();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "تم حذف العنوان بنجاح",
      data: user.locations,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف العنوان",
    });
  }
};


export const setDefaultLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    const user = await User.findById(req.user._id);

    const location = user.locations.id(locationId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "العنوان غير موجود",
      });
    }

    // الغاء default من كل العناوين
    user.locations.forEach((loc) => {
      loc.default = false;
    });

    // تعيين العنوان الحالي كافتراضي
    location.default = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "تم تعيين العنوان كافتراضي",
      data: user.locations,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث العنوان",
    });
  }
};

