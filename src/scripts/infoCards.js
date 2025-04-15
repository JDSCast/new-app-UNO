// Importar Firebase y Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Configuración de tu proyecto Firebase
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const colors = ['red', 'green', 'blue', 'yellow'];
const actionCards = ['skip', 'reverse', 'draw_two'];
const wildCards = ['wild', 'wild_draw_four'];

const cards = [];

// Cartas numéricas (1 cero por color, 2 de cada número del 1-9 por color)
colors.forEach((color) => {
  // Un solo cero por color
  cards.push({
    color: color,
    type: 'number',
    number: 0
  });

  // Dos de cada número del 1 al 9 por color
  for (let num = 1; num <= 9; num++) {
    cards.push({
      color: color,
      type: 'number',
      number: num
    });
    cards.push({
      color: color,
      type: 'number',
      number: num
    });
  }
});

// Cartas de acción (2 de cada tipo por color)
colors.forEach((color) => {
  actionCards.forEach((actionType) => {
    cards.push({
      color: color,
      type: actionType,
      number: null
    });
    cards.push({
      color: color,
      type: actionType,
      number: null
    });
  });
});

// Cartas wild (4 de cada tipo)
wildCards.forEach((wildType) => {
  for (let i = 0; i < 4; i++) {
    cards.push({
      color: 'wild',
      type: wildType,
      number: null
    });
  }
});

const uploadCards = async () => {
  try {
    const cardsRef = collection(db, 'cards');

    for (const card of cards) {
      console.log('Uploading card:', card);
      await addDoc(cardsRef, card);
    }

    console.log('All cards uploaded successfully!');
    console.log(`Total cards: ${cards.length}`);
  } catch (error) {
    console.error('Error uploading cards:', error);
  }
};

uploadCards();