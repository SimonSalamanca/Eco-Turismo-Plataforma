require('dotenv').config();
const { sequelize } = require('../../config/db');
const { User, HostProfile, Listing, Subscription } = require('../models/index');
const { hashPassword } = require('../../utils/bcrypt.utils');

const departments = [
  { name: 'Antioquia', municipalities: ['Medellín', 'Jardín', 'Guatapé', 'Santa Fe de Antioquia', 'El Carmen de Viboral'] },
  { name: 'Cundinamarca', municipalities: ['Zipaquirá', 'Cachipay', 'La Mesa', 'Tobia', 'Villeta'] },
  { name: 'Eje Cafetero', municipalities: ['Salento', 'Filandia', 'Pijao', 'Jardín', 'Barbassosa'] },
  { name: 'Valle del Cauca', municipalities: ['Cartago', 'Calima', 'Buga', 'Roldanillo', 'Al cales'] },
  { name: 'Magdalena', municipalities: ['Minca', 'Palomino', 'Taganga', 'Bonda', 'Cienaga'] }
];

const categories = [
  'ecoturismo', 'avistamiento de aves', 'trekking', 'cascadas', 'finca cafetera',
  'reserva natural', 'cabañas', 'glamping', 'camping', 'hosteria rural'
];

const listingTitles = {
  accommodation: [
    'Finca Café La Esperanza',
    'Cabaña El Roble - Reserva Natural',
    'Glamping Entre Nubes',
    'Hospedaje Rural La Taganga',
    'Eco Lodge El Paraíso',
    'Finca Agroturística El Carmen',
    'Cabaña Madera y Luna',
    'Posada Campestre Las Palmeras',
    'Refugio de Montaña El Mirador',
    'Alojamiento Natural El Descanso'
  ],
  activity: [
    'Avistamiento de Aves en el Magdalena',
    'Trekking a la Cascada Escondida',
    'Tour de Café Experiencia',
    'Senderismo Nocturno en la Reserva',
    'Paseo a Caballo por el Cafetal',
    'Degustación de Cacao y Café',
    'Tour Fotográfico de Naturaleza',
    'Caminata a los Farallones',
    'Experiencia de Yoga en la Montaña',
    'Clase de Cocina Ancestral'
  ]
};

async function seed() {
  console.log('🌱 Iniciando seed...');

  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a BD OK');

    console.log('   Limpiando tablas...');
    await sequelize.query('TRUNCATE TABLE users, host_profiles, listings, subscriptions, reservations, payments, reviews, notifications, audit_logs, content_reports CASCADE');

    console.log('   Creando usuarios...');

    const admin = await User.create({
      email: 'admin@ecoturismo.com',
      password_hash: await hashPassword('Admin123!'),
      full_name: 'Administrador Eco Turismo',
      phone: '+573001234567',
      role: 'admin',
      status: 'active',
      email_verified_at: new Date()
    });

    const hosts = [];
    for (let i = 1; i <= 5; i++) {
      const dept = departments[i - 1];
      const user = await User.create({
        email: `host${i}@ecoturismo.com`,
        password_hash: await hashPassword('Host1234!'),
        full_name: `Anfitrión ${i} - ${dept.name}`,
        phone: `+57300${100 + i}`,
        role: 'host',
        status: 'active',
        email_verified_at: new Date()
      });

      const hostProfile = await HostProfile.create({
        user_id: user.id,
        business_name: `EcoNegocios ${dept.name}`,
        business_type: i % 3 === 0 ? 'both' : 'accommodation',
        department: dept.name,
        municipality: dept.municipalities[Math.floor(Math.random() * dept.municipalities.length)],
        description: `Alojamiento rural eco-amigable en ${dept.name}`,
        subscription_plan: i === 1 ? 'pro' : i === 2 ? 'premium' : 'basic',
        subscription_status: 'active',
        subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });

      hosts.push({ user, hostProfile });
    }

    console.log('   Creando listings...');
    const listings = [];
    for (let h = 0; h < hosts.length; h++) {
      const { user, hostProfile } = hosts[h];
      const numListings = hostProfile.subscription_plan === 'pro' ? 5 : hostProfile.subscription_plan === 'premium' ? 3 : 2;

      for (let j = 0; j < numListings; j++) {
        const isAccommodation = j % 2 === 0;
        const titles = isAccommodation ? listingTitles.accommodation : listingTitles.activity;
        const title = titles[(h * 2 + j) % titles.length];
        const dept = departments[h];

        const listing = await Listing.create({
          host_id: user.id,
          title: `${title} - ${dept.municipalities[j % dept.municipalities.length]}`,
          type: isAccommodation ? 'accommodation' : 'activity',
          description: `Hermoso espacio ${isAccommodation ? 'de alojamiento' : 'para actividad'} en ${dept.name}. Disfruta de la naturaleza y la tranquilidad.`,
          price_per_unit: Math.floor(Math.random() * 150000) + 50000,
          capacity: Math.floor(Math.random() * 8) + 2,
          categories: categories.slice(0, Math.floor(Math.random() * 4) + 1),
          status: 'active',
          latitude: 4.5 + Math.random() * 2,
          longitude: -74 + Math.random() * 4,
          address: `Vereda El Silencio, ${dept.municipalities[j % dept.municipalities.length]}`,
          department: dept.name,
          municipality: dept.municipalities[j % dept.municipalities.length],
          photos: [
            { url: `https://picsum.photos/seed/${h}${j}1/800/600`, order: 0, is_cover: true },
            { url: `https://picsum.photos/seed/${h}${j}2/800/600`, order: 1, is_cover: false },
            { url: `https://picsum.photos/seed/${h}${j}3/800/600`, order: 2, is_cover: false }
          ],
          badge: hostProfile.subscription_plan === 'pro' ? 'pro' : hostProfile.subscription_plan === 'premium' ? 'premium' : 'none',
          search_boost: hostProfile.subscription_plan === 'pro' ? 2 : hostProfile.subscription_plan === 'premium' ? 1 : 0,
          average_rating: (Math.random() * 2 + 3).toFixed(1),
          review_count: Math.floor(Math.random() * 15)
        });

        listings.push(listing);
      }
    }

    console.log('   Creando turista de prueba...');
    const tourist = await User.create({
      email: 'turista@test.com',
      password_hash: await hashPassword('Turista123!'),
      full_name: 'Turista de Prueba',
      phone: '+573009999999',
      role: 'tourist',
      status: 'active',
      email_verified_at: new Date()
    });

    console.log('\n✅ Seed completado!');
    console.log(`   Admin: admin@ecoturismo.com / Admin123!`);
    console.log(`   Host 1: host1@ecoturismo.com / Host1234! (plan pro)`);
    console.log(`   Host 2: host2@ecoturismo.com / Host1234! (plan premium)`);
    console.log(`   Host 3: host3@ecoturismo.com / Host1234! (plan basic)`);
    console.log(`   Turista: turista@test.com / Turista123!`);
    console.log(`   ${listings.length} listings creados`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed falló:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seed();