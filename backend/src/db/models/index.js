const { sequelize } = require('../../config/db');
const User = require('./user.model');
const HostProfile = require('./hostProfile.model');
const Listing = require('./listing.model');
const Availability = require('./availability.model');
const Reservation = require('./reservation.model');
const Payment = require('./payment.model');
const Review = require('./review.model');
const Subscription = require('./subscription.model');
const Notification = require('./notification.model');
const AuditLog = require('./auditLog.model');
const ContentReport = require('./contentReport.model');
const Favorite = require('./favorite.model');

User.hasOne(HostProfile, { foreignKey: 'user_id', as: 'hostProfile' });
HostProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Listing, { foreignKey: 'host_id', as: 'listings' });
Listing.belongsTo(User, { foreignKey: 'host_id', as: 'host' });

Listing.hasMany(Availability, { foreignKey: 'listing_id', as: 'availabilities' });
Availability.belongsTo(Listing, { foreignKey: 'listing_id', as: 'listing' });

Listing.hasMany(Reservation, { foreignKey: 'listing_id', as: 'reservations' });
Reservation.belongsTo(Listing, { foreignKey: 'listing_id', as: 'listing' });

User.hasMany(Reservation, { foreignKey: 'tourist_id', as: 'touristReservations' });
Reservation.belongsTo(User, { foreignKey: 'tourist_id', as: 'tourist' });

User.hasMany(Reservation, { foreignKey: 'host_id', as: 'hostReservations' });
Reservation.belongsTo(User, { foreignKey: 'host_id', as: 'hostUser' });

Reservation.hasMany(Payment, { foreignKey: 'reservation_id', as: 'payments' });
Payment.belongsTo(Reservation, { foreignKey: 'reservation_id', as: 'reservation' });

User.hasMany(Payment, { foreignKey: 'tourist_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'tourist_id', as: 'touristUser' });

Reservation.hasOne(Review, { foreignKey: 'reservation_id', as: 'review' });
Review.belongsTo(Reservation, { foreignKey: 'reservation_id', as: 'reservation' });

Listing.hasMany(Review, { foreignKey: 'listing_id', as: 'reviews' });
Review.belongsTo(Listing, { foreignKey: 'listing_id', as: 'listing' });

User.hasMany(Review, { foreignKey: 'tourist_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'tourist_id', as: 'tourist' });

User.hasMany(Subscription, { foreignKey: 'host_id', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'host_id', as: 'hostUser' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'admin_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

User.hasMany(ContentReport, { foreignKey: 'reporter_id', as: 'reports' });
ContentReport.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });

User.hasMany(ContentReport, { foreignKey: 'resolved_by', as: 'resolvedReports' });
ContentReport.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolver' });

User.hasMany(Favorite, { foreignKey: 'tourist_id', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'tourist_id', as: 'tourist' });

Listing.hasMany(Favorite, { foreignKey: 'listing_id', as: 'favorites' });
Favorite.belongsTo(Listing, { foreignKey: 'listing_id', as: 'listing' });

module.exports = {
  sequelize,
  User,
  HostProfile,
  Listing,
  Availability,
  Reservation,
  Payment,
  Review,
  Subscription,
  Notification,
  AuditLog,
  ContentReport,
  Favorite
};