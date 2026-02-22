/* ═══════════════════════════════════════════════
   TOPICS — Matchup Content Generator
   ═══════════════════════════════════════════════ */

const TOPICS = {
    'Food Fights': [
        ['Pizza', 'Burgers'],
        ['Ice Cream', 'Cake'],
        ['Sushi', 'Tacos'],
        ['Chocolate', 'Sweets'],
        ['Breakfast', 'Dinner'],
        ['Coffee', 'Tea'],
        ['Pasta', 'Rice'],
        ['BBQ Ribs', 'Fried Chicken'],
        ['Pancakes', 'Waffles'],
        ['Chips', 'Popcorn'],
        ['Steak', 'Lobster'],
        ['Smoothies', 'Milkshakes'],
        ['Doughnuts', 'Croissants'],
        ['Mac & Cheese', 'Lasagna'],
        ['Nachos', 'Loaded Fries'],
        ['Ice Lolly', 'Ice Cream Sandwich'],
    ],
    'Travel': [
        ['Beach Holiday', 'City Break'],
        ['Mountains', 'Countryside'],
        ['Road Trip', 'Cruise Ship'],
        ['Europe', 'Asia'],
        ['Camping', 'Luxury Hotel'],
        ['Summer Getaway', 'Winter Escape'],
        ['Backpacking', 'All-Inclusive'],
        ['Flight', 'Train Journey'],
        ['Desert Safari', 'Jungle Trek'],
        ['Amusement Park', 'Water Park'],
        ['Northern Lights', 'Tropical Sunset'],
        ['Ski Resort', 'Surf Beach'],
        ['Solo Travel', 'Group Holiday'],
        ['Airbnb', 'Boutique Hotel'],
        ['Window Seat', 'Aisle Seat'],
    ],
    'Movies & TV': [
        ['Action', 'Comedy'],
        ['Marvel', 'DC'],
        ['Horror', 'Romance'],
        ['Netflix', 'Cinema'],
        ['Star Wars', 'Lord of the Rings'],
        ['Animated', 'Live Action'],
        ['Series Binge', 'Movie Marathon'],
        ['Sci-Fi', 'Fantasy'],
        ['Documentary', 'Reality TV'],
        ['Subtitles', 'Dubbed'],
        ['Classic Films', 'Modern Blockbusters'],
        ['Villain Wins', 'Hero Wins'],
        ['Plot Twist', 'Happy Ending'],
        ['Popcorn', 'Pick \'n\' Mix'],
        ['Opening Night', 'Wait for Streaming'],
    ],
    'Tech': [
        ['iPhone', 'Android'],
        ['PC', 'Console'],
        ['PlayStation', 'Xbox'],
        ['TikTok', 'YouTube'],
        ['Instagram', 'Snapchat'],
        ['Robot Butler', 'Self-Driving Car'],
        ['VR Headset', 'Drone'],
        ['Smart Watch', 'Smart Glasses'],
        ['WiFi', 'Unlimited Data'],
        ['Dark Mode', 'Light Mode'],
        ['Mechanical Keyboard', 'Touchscreen'],
        ['AI Assistant', 'Human Assistant'],
        ['Video Call', 'Voice Call'],
        ['Tablet', 'Laptop'],
        ['Wireless Earbuds', 'Over-Ear Headphones'],
    ],
    'Sports & Fitness': [
        ['Football', 'Basketball'],
        ['Running', 'Swimming'],
        ['Gym', 'Outdoor Exercise'],
        ['Team Sport', 'Solo Sport'],
        ['Morning Workout', 'Evening Workout'],
        ['Yoga', 'Weight Training'],
        ['Cricket', 'Tennis'],
        ['Olympics', 'World Cup'],
        ['Play Sports', 'Watch Sports'],
        ['Boxing', 'Martial Arts'],
        ['Rock Climbing', 'Surfing'],
        ['Sprint', 'Marathon'],
        ['Golf', 'Bowling'],
        ['Skiing', 'Snowboarding'],
        ['Dance Class', 'HIIT Workout'],
    ],
    'Lifestyle': [
        ['Morning Person', 'Night Owl'],
        ['Dogs', 'Cats'],
        ['City Life', 'Country Life'],
        ['Summer', 'Winter'],
        ['Book', 'Podcast'],
        ['Cook at Home', 'Eat Out'],
        ['Sweet', 'Savoury'],
        ['Bath', 'Shower'],
        ['Messy Room', 'Clean Freak'],
        ['Early Bird', 'Late Riser'],
        ['Phone Call', 'Text Message'],
        ['Big Party', 'Small Gathering'],
        ['Online Shopping', 'High Street'],
        ['Save Money', 'Spend on Experiences'],
        ['Window Open', 'AC Blasting'],
        ['Live Music', 'Vinyl Records'],
    ],
    'Hypothetical': [
        ['Fly', 'Invisibility'],
        ['Time Travel', 'Teleportation'],
        ['Read Minds', 'See the Future'],
        ['Live Underwater', 'Live in Space'],
        ['Super Strength', 'Super Speed'],
        ['Talk to Animals', 'Speak All Languages'],
        ['Unlimited Money', 'Unlimited Free Time'],
        ['No Internet for a Year', 'No Music for a Year'],
        ['Always Hot', 'Always Cold'],
        ['Live 200 Years', 'Restart Life at 10'],
        ['Never Sleep', 'Never Eat'],
        ['Giant Hamster', 'Tiny Elephant'],
        ['No Phone', 'No TV'],
        ['Zombie Apocalypse', 'Alien Invasion'],
        ['Be Famous', 'Be a Genius'],
    ],
    'Gross!': [
        ['Eat a Bug', 'Lick a Lamppost'],
        ['Drink Ketchup', 'Drink Mayonnaise'],
        ['Swim in Baked Beans', 'Swim in Custard'],
        ['No Shower for a Week', 'No Teeth Brushing for a Week'],
        ['Smell Bad Always', 'Taste Nothing'],
        ['Wear Wet Socks Forever', 'Have a Pebble in Your Shoe Forever'],
        ['Eat Raw Onion', 'Eat Raw Garlic'],
        ['Talk in Burps', 'Sneeze Glitter'],
        ['Step in Gum', 'Sit on Wet Seat'],
        ['Lick the Floor', 'Eat a Worm'],
        ['Sleep in Mud', 'Sleep in Jelly'],
        ['Eat Dog Food', 'Drink Fish Water'],
        ['Sweat Syrup', 'Cry Milk'],
        ['Never Cut Nails', 'Never Cut Hair'],
        ['Only Wear Crocs', 'Only Wear Sandals with Socks'],
    ]
};

/**
 * Get the ordered list of topic names
 */
export function getTopicNames() {
    return Object.keys(TOPICS);
}

/**
 * Generate a shuffled set of matchups for a topic
 * @param {string} topicName
 * @param {number} count — number of rounds
 * @returns {{ optionA: string, optionB: string }[]}
 */
export function generateRounds(topicName, count) {
    const pool = TOPICS[topicName];
    if (!pool) return [];

    // Shuffle a copy
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    const rounds = [];
    for (let i = 0; i < count; i++) {
        const pair = shuffled[i % shuffled.length];
        // Randomly swap A/B so left/right isn't predictable
        if (Math.random() > 0.5) {
            rounds.push({ optionA: pair[0], optionB: pair[1] });
        } else {
            rounds.push({ optionA: pair[1], optionB: pair[0] });
        }
    }
    return rounds;
}

/**
 * Build a loremflickr image URL for a single option
 * Uses lock parameter for cache-busting between options
 */
export function getOptionImageUrl(option, topic) {
    // Clean keywords for URL — use option + topic for better relevance
    const keywords = encodeURIComponent(option.replace(/[^a-zA-Z0-9 ]/g, '').trim());
    // lock= ensures same keyword returns same image (deterministic caching)
    const lock = encodeURIComponent(option + topic);
    return `https://loremflickr.com/400/300/${keywords}?lock=${lock}`;
}

/**
 * Preload images for a round (call during current round)
 */
export function preloadRoundImages(optionA, optionB, topic) {
    const imgA = new Image();
    imgA.src = getOptionImageUrl(optionA, topic);
    const imgB = new Image();
    imgB.src = getOptionImageUrl(optionB, topic);
}
