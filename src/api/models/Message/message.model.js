import { Model } from 'sequelize';

/**
 * Defines the Message model.
 *
 * @param {import('sequelize').Sequelize} sequelize - The Sequelize instance.
 * @param {import('sequelize').DataTypes} DataTypes - The data types module.
 */
export default (sequelize, DataTypes) => {
  /**
   * @class Message
   *
   * @property {string} MessageID - The unique ID of the message.
   * @property {string} Body - Contains the message content if any.
   * @property {string} Image - Contains the image content if any.
   * @property {Date} CreatedAt - The date when the message was created.
   */
  class Message extends Model {}

  Message.init(
    {
      MessageID: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      Body: {
        type: DataTypes.STRING,
        allowNull: true
      },
      Image: {
        type: DataTypes.STRING,
        allowNull: true
      },
      CreatedAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
      timestamps: false
    }
  );

  Message.associate = (models) => {
    Message.hasMany(models.SeenUserMessage, { foreignKey: 'MessageID' });

    Message.belongsTo(models.User, { foreignKey: 'SenderID' });

    Message.belongsToMany(models.User, {
      as: 'SeenUsers',
      through: models.SeenUserMessage,
      foreignKey: 'MessageID'
    });

    Message.belongsTo(models.Conversation, {
      foreignKey: 'ConversationID'
    });
  };

  return Message;
};
