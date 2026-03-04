import { CallbackWithoutResultAndOptionalError, Schema } from 'mongoose';
import { getUserIdFromContext } from './request-context';

export function mongooseAuditPlugin(schema: Schema) {
  // add fields if not already present
  if (!schema.path('createdBy')) {
    schema.add({ createdBy: { type: String, required: false, index: true } });
  }
  if (!schema.path('updatedBy')) {
    schema.add({ updatedBy: { type: String, required: false, index: true } });
  }

  // set createdBy on create
  schema.pre('save', function (next: CallbackWithoutResultAndOptionalError) {
    const doc: any = this;
    const uid = getUserIdFromContext();
    if (doc.isNew && uid) {
      doc.createdBy = doc.createdBy || uid;
      doc.updatedBy = uid;
    } else if (uid) {
      doc.updatedBy = uid;
    }
    next();
  });

  // set updatedBy on update queries
  const setUpdatedBy = function (this: any) {
    const uid = getUserIdFromContext();
    if (!uid) return;
    const update = this.getUpdate() || {};
    if (update.$set) {
      update.$set.updatedBy = uid;
    } else {
      update.$set = { updatedBy: uid };
    }
    this.setUpdate(update);
  };

  schema.pre('findOneAndUpdate', setUpdatedBy);
  schema.pre('updateOne', setUpdatedBy);
  schema.pre('updateMany', setUpdatedBy);
}
