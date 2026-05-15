const listingsService = require('../../modules/listings/listings.service');
const { sequelize, User, HostProfile, Listing } = require('../../db/models');
const { AppError } = require('../../middleware/errorHandler.middleware');

jest.mock('../../config/redis', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(true),
  cacheDelete: jest.fn().mockResolvedValue(true),
  cacheDeletePattern: jest.fn().mockResolvedValue(true)
}));

describe('Listings Service - Unit Tests', () => {
  let hostUser, hostProfile;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    hostUser = await User.create({
      email: `host.${Date.now()}@example.com`,
      password_hash: '$2b$12$hashed',
      full_name: 'Test Host',
      role: 'host',
      status: 'active'
    });

    hostProfile = await HostProfile.create({
      user_id: hostUser.id,
      business_name: 'Test Host Business',
      business_type: 'accommodation',
      subscription_plan: 'basic'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await Listing.destroy({ where: {}, force: true });
  });

  describe('createListing', () => {
    it('should create a listing for a host', async () => {
      const listingData = {
        title: 'Beautiful Cabin',
        type: 'accommodation',
        description: 'A nice cabin in the mountains',
        price_per_unit: 150000,
        capacity: 4,
        department: 'Antioquia',
        municipality: 'Guatape'
      };

      const listing = await listingsService.createListing(hostUser.id, listingData);

      expect(listing).toBeDefined();
      expect(listing.title).toBe('Beautiful Cabin');
      expect(listing.host_id).toBe(hostUser.id);
      expect(listing.badge).toBe('none');
    });

    it('should create listing with premium badge for premium plan', async () => {
      await hostProfile.update({ subscription_plan: 'premium' });

      const listingData = {
        title: 'Premium Listing',
        type: 'accommodation',
        price_per_unit: 200000,
        capacity: 2
      };

      const listing = await listingsService.createListing(hostUser.id, listingData);
      expect(listing.badge).toBe('premium');
    });

    it('should create listing with pro badge for pro plan', async () => {
      await hostProfile.update({ subscription_plan: 'pro' });

      const listingData = {
        title: 'Pro Listing',
        type: 'activity',
        price_per_unit: 100000,
        capacity: 10
      };

      const listing = await listingsService.createListing(hostUser.id, listingData);
      expect(listing.badge).toBe('pro');
    });

    it('should reject non-host user', async () => {
      const tourist = await User.create({
        email: `tourist.${Date.now()}@example.com`,
        password_hash: '$2b$12$hashed',
        full_name: 'Tourist User',
        role: 'tourist',
        status: 'active'
      });

      await expect(listingsService.createListing(tourist.id, {
        title: 'Test',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 1
      })).rejects.toThrow('No tienes permiso');
    });

    it('should enforce listing limit for basic plan', async () => {
      await hostProfile.update({ subscription_plan: 'basic' });

      await listingsService.createListing(hostUser.id, {
        title: 'Listing 1',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2
      });

      await listingsService.createListing(hostUser.id, {
        title: 'Listing 2',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2
      });

      await expect(listingsService.createListing(hostUser.id, {
        title: 'Listing 3',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2
      })).rejects.toThrow('Límite de listings alcanzado');
    });
  });

  describe('getListingById', () => {
    it('should return listing by id', async () => {
      const listing = await listingsService.createListing(hostUser.id, {
        title: 'Test Listing',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2
      });

      const found = await listingsService.getListingById(listing.id);
      expect(found.id).toBe(listing.id);
      expect(found.title).toBe('Test Listing');
    });

    it('should return cached listing', async () => {
      const listing = await listingsService.createListing(hostUser.id, {
        title: 'Cached Listing',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2
      });

      const { cacheGet } = require('../../config/redis');
      cacheGet.mockResolvedValueOnce(listing.toJSON());

      const found = await listingsService.getListingById(listing.id);
      expect(found.title).toBe('Cached Listing');
    });

    it('should throw error for non-existent listing', async () => {
      await expect(listingsService.getListingById('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow('Listing no encontrado');
    });
  });

  describe('searchListings', () => {
    beforeEach(async () => {
      await listingsService.createListing(hostUser.id, {
        title: 'Mountain Cabin',
        type: 'accommodation',
        price_per_unit: 150000,
        capacity: 4,
        department: 'Antioquia',
        municipality: 'Guatape',
        average_rating: 4.5
      });

      await listingsService.createListing(hostUser.id, {
        title: 'Forest Trek',
        type: 'activity',
        price_per_unit: 80000,
        capacity: 10,
        department: 'Cundinamarca',
        municipality: 'La Vega',
        average_rating: 4.0
      });
    });

    it('should search by type', async () => {
      const result = await listingsService.searchListings({ type: 'accommodation' });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data[0].type).toBe('accommodation');
    });

    it('should search by department', async () => {
      const result = await listingsService.searchListings({ department: 'Antioquia' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].department).toBe('Antioquia');
    });

    it('should search by price range', async () => {
      const result = await listingsService.searchListings({
        price_min: 100000,
        price_max: 200000
      });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should sort by price ascending', async () => {
      const result = await listingsService.searchListings({ sort: 'price_asc' });
      expect(result.data[0].price_per_unit).toBeLessThanOrEqual(result.data[1]?.price_per_unit || 0);
    });

    it('should sort by rating', async () => {
      const result = await listingsService.searchListings({ sort: 'rating' });
      expect(result.data[0].average_rating).toBeGreaterThanOrEqual(result.data[1]?.average_rating || 0);
    });

    it('should return paginated results', async () => {
      const result = await listingsService.searchListings({ page: 1, limit: 1 });
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(1);
    });
  });

  describe('calculateHaversineDistance', () => {
    it('should calculate distance between two points', async () => {
      const result = await listingsService.searchListings({
        lat: 6.2476,
        lng: -75.5658,
        radius: 10,
        type: 'accommodation'
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should return empty array for no listings in radius', async () => {
      const result = await listingsService.searchListings({
        lat: 4.7110,
        lng: -74.0721,
        radius: 5,
        type: 'accommodation'
      });

      expect(result.data).toEqual([]);
    });
  });

  describe('updateListing', () => {
    it('should update listing by owner', async () => {
      const listing = await listingsService.createListing(hostUser.id, {
        title: 'Original Title',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2
      });

      const updated = await listingsService.updateListing(listing.id, hostUser.id, {
        title: 'Updated Title'
      });

      expect(updated.title).toBe('Updated Title');
    });

    it('should not allow non-owner to update', async () => {
      const listing = await listingsService.createListing(hostUser.id, {
        title: 'Test',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2
      });

      const otherHost = await User.create({
        email: `other.${Date.now()}@example.com`,
        password_hash: '$2b$12$hashed',
        full_name: 'Other Host',
        role: 'host',
        status: 'active'
      });

      await expect(listingsService.updateListing(listing.id, otherHost.id, {
        title: 'Hacked Title'
      })).rejects.toThrow('No tienes permiso');
    });
  });

  describe('deleteListing', () => {
    it('should soft delete listing', async () => {
      const listing = await listingsService.createListing(hostUser.id, {
        title: 'To Delete',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2
      });

      const result = await listingsService.deleteListing(listing.id, hostUser.id);
      expect(result.message).toContain('eliminado');

      const deleted = await Listing.findByPk(listing.id);
      expect(deleted.status).toBe('deleted');
    });

    it('should not delete listing with active reservations', async () => {
      const listing = await listingsService.createListing(hostUser.id, {
        title: 'With Reservations',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2
      });

      const { Reservation } = require('../../db/models');
      await Reservation.create({
        listing_id: listing.id,
        tourist_id: hostUser.id,
        host_id: hostUser.id,
        check_in_date: '2025-01-01',
        check_out_date: '2025-01-02',
        guests_count: 1,
        subtotal: 100000,
        platform_fee: 10000,
        total_amount: 110000,
        status: 'confirmed'
      });

      await expect(listingsService.deleteListing(listing.id, hostUser.id))
        .rejects.toThrow('reservas activas');
    });
  });

  describe('addPhotos', () => {
    it('should add photos within plan limit', async () => {
      const listing = await listingsService.createListing(hostUser.id, {
        title: 'Photo Test',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2
      });

      const photos = [
        { url: '/uploads/photo1.webp' },
        { url: '/uploads/photo2.webp' }
      ];

      const updated = await listingsService.addPhotos(listing.id, hostUser.id, photos);
      expect(updated.photos.length).toBe(2);
    });

    it('should reject photos over plan limit', async () => {
      await hostProfile.update({ subscription_plan: 'basic' });

      const listing = await listingsService.createListing(hostUser.id, {
        title: 'Photo Limit Test',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2
      });

      const photos = Array(6).fill(null).map((_, i) => ({ url: `/uploads/photo${i}.webp` }));

      await expect(listingsService.addPhotos(listing.id, hostUser.id, photos))
        .rejects.toThrow('Límite de 5 fotos');
    });
  });
});