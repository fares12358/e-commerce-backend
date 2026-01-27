import Attribute from './attribute.model.js';

/* ================= CREATE ATTRIBUTE ================= */
export const createAttribute = async (req, res) => {
  try {
    const { name, key, type } = req.body;

    if (!name || !key) {
      return res.status(400).json({
        success: false,
        message: 'اسم الخاصية والمفتاح مطلوبان'
      });
    }

    const exists = await Attribute.findOne({ key });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'هذه الخاصية موجودة بالفعل'
      });
    }

    const attribute = await Attribute.create({
      name,
      key,
      type
    });

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الخاصية بنجاح',
      data: attribute
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الخاصية'
    });
  }
};

/* ================= GET ALL ATTRIBUTES ================= */
export const getAttributes = async (req, res) => {
  try {
    const attributes = await Attribute.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'تم جلب الخصائص بنجاح',
      data: attributes
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الخصائص'
    });
  }
};

/* ================= UPDATE ATTRIBUTE ================= */
export const updateAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, key } = req.body;

    const attribute = await Attribute.findById(id);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: 'الخاصية غير موجودة'
      });
    }

    if (name) attribute.name = name;
    if (type) attribute.type = type;
    if (key) attribute.key = key;

    await attribute.save();

    return res.status(200).json({
      success: true,
      message: 'تم تحديث الخاصية بنجاح',
      data: attribute
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الخاصية'
    });
  }
};

/* ================= DELETE (DISABLE) ATTRIBUTE ================= */
export const AttributeStauts = async (req, res) => {
  try {
    const { id } = req.params;

    const attribute = await Attribute.findById(id);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: 'الخاصية غير موجودة'
      });
    }

    attribute.isActive = !attribute.isActive;
    await attribute.save();

    return res.status(200).json({
      success: true,
      message: 'تم حذف الخاصية بنجاح'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الخاصية'
    });
  }
};

/* ================= DELETE ATTRIBUTE (PERMANENT) ================= */
export const deleteAttribute = async (req, res) => {
  try {
    const { id } = req.params;

    const attribute = await Attribute.findById(id);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: 'الخاصية غير موجودة'
      });
    }

    await attribute.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'تم حذف الخاصية نهائيًا'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحذف النهائي للخاصية'
    });
  }
};
