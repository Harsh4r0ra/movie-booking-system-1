import React, { useState } from 'react';
import { AlertCircle, Clock, Calendar, MapPin, Film, Coffee } from 'lucide-react';
import { Alert, AlertDescription } from './components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';

// Constants
const SCREEN_TYPES = {
  GOLD: { name: 'Gold', price: 400, capacity: 20, foodDiscount: 0.10 },
  MAX: { name: 'Max', price: 300, capacity: 40, foodDiscount: 0.05 },
  GENERAL: { name: 'General', price: 200, capacity: 100, foodDiscount: 0 }
};

const FOOD_ITEMS = {
  POPCORN: { name: 'Popcorn', price: 150 },
  SANDWICH: { name: 'Sandwich', price: 100 }
};

// Mock data for theaters
const THEATERS = [
  {
    id: 1,
    name: 'PVR Cinemas',
    location: 'Mumbai',
    movies: [
      { id: 1, name: 'Inception', showTime: '2024-10-28T14:30:00' },
      { id: 2, name: 'The Dark Knight', showTime: '2024-10-26T18:00:00' }
    ]
  },
  {
    id: 2,
    name: 'INOX',
    location: 'Delhi',
    movies: [
      { id: 3, name: 'Interstellar', showTime: '2024-10-26T15:00:00' },
      { id: 4, name: 'Dune', showTime: '2024-10-26T20:00:00' }
    ]
  }
];

const MovieBookingSystem = () => {
  // State management
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedScreenType, setSelectedScreenType] = useState(null);
  const [selectedFood, setSelectedFood] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [bookingStatus, setBookingStatus] = useState(null);

  // Generate a random booking ID
  const generateBookingId = () => Math.random().toString(36).substr(2, 9);

  // Check if show is sold out
  const isShowSoldOut = (movie, screenType) => {
    const currentBookings = bookings.filter(
      b => b.movieId === movie.id && b.screenType === screenType
    );
    return currentBookings.length >= SCREEN_TYPES[screenType].capacity;
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!selectedScreenType) return 0;
    
    let total = SCREEN_TYPES[selectedScreenType].price;
    
    // Add food prices with applicable discounts
    const foodDiscount = SCREEN_TYPES[selectedScreenType].foodDiscount;
    const foodTotal = selectedFood.reduce((sum, food) => sum + FOOD_ITEMS[food].price, 0);
    total += foodTotal * (1 - foodDiscount);
    
    return total;
  };

  // Handle booking
  const handleBooking = () => {
    if (!selectedTheater || !selectedMovie || !selectedScreenType) {
      setBookingStatus({ type: 'error', message: 'Please select all required fields' });
      return;
    }

    if (isShowSoldOut(selectedMovie, selectedScreenType)) {
      // Add to waiting list
      const waitingBooking = {
        id: generateBookingId(),
        theaterId: selectedTheater.id,
        movieId: selectedMovie.id,
        screenType: selectedScreenType,
        food: selectedFood,
        timestamp: new Date().toISOString()
      };
      setWaitingList([...waitingList, waitingBooking]);
      setBookingStatus({ 
        type: 'warning', 
        message: 'Show is sold out. You have been added to the waiting list.' 
      });
      return;
    }

    // Create new booking
    const newBooking = {
      id: generateBookingId(),
      theaterId: selectedTheater.id,
      movieId: selectedMovie.id,
      screenType: selectedScreenType,
      food: selectedFood,
      timestamp: new Date().toISOString()
    };
    
    setBookings([...bookings, newBooking]);
    setBookingStatus({ 
      type: 'success', 
      message: `Booking confirmed! Booking ID: ${newBooking.id}` 
    });
  };

  // Handle cancellation
  const handleCancellation = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const movieShowTime = THEATERS
      .find(t => t.id === booking.theaterId)
      .movies.find(m => m.id === booking.movieId).showTime;

    const timeUntilShow = new Date(movieShowTime) - new Date();
    const minutesUntilShow = timeUntilShow / (1000 * 60);

    if (minutesUntilShow < 30) {
      setBookingStatus({ 
        type: 'error', 
        message: 'Cannot cancel booking less than 30 minutes before show time' 
      });
      return;
    }

    // Remove booking
    setBookings(bookings.filter(b => b.id !== bookingId));

    // Check waiting list
    const waitingBooking = waitingList.find(
      w => w.movieId === booking.movieId && w.screenType === booking.screenType
    );

    if (waitingBooking) {
      // Move waiting booking to confirmed bookings
      setBookings([...bookings.filter(b => b.id !== bookingId), {
        ...waitingBooking,
        id: generateBookingId()
      }]);
      setWaitingList(waitingList.filter(w => w.id !== waitingBooking.id));
      setBookingStatus({ 
        type: 'success', 
        message: 'Booking cancelled and allocated to waiting list customer' 
      });
    } else {
      setBookingStatus({ 
        type: 'success', 
        message: 'Booking cancelled successfully' 
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Movie Ticket Booking System</h1>
      
      {/* Booking Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Book Movie Tickets</CardTitle>
          <CardDescription>Select your preferences below</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Theater Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Theater</label>
            <select 
              className="w-full p-2 border rounded"
              onChange={(e) => {
                const theater = THEATERS.find(t => t.id === parseInt(e.target.value));
                setSelectedTheater(theater);
                setSelectedMovie(null);
              }}
            >
              <option value="">Choose a theater...</option>
              {THEATERS.map(theater => (
                <option key={theater.id} value={theater.id}>
                  {theater.name} - {theater.location}
                </option>
              ))}
            </select>
          </div>

          {/* Movie Selection */}
          {selectedTheater && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Movie</label>
              <select 
                className="w-full p-2 border rounded"
                onChange={(e) => {
                  const movie = selectedTheater.movies.find(m => m.id === parseInt(e.target.value));
                  setSelectedMovie(movie);
                }}
              >
                <option value="">Choose a movie...</option>
                {selectedTheater.movies.map(movie => (
                  <option key={movie.id} value={movie.id}>
                    {movie.name} - {new Date(movie.showTime).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Screen Type Selection */}
          {selectedMovie && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Screen Type</label>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(SCREEN_TYPES).map(([type, details]) => (
                  <button
                    key={type}
                    className={`p-4 border rounded ${selectedScreenType === type ? 'bg-blue-100 border-blue-500' : ''}`}
                    onClick={() => setSelectedScreenType(type)}
                  >
                    <div className="font-medium">{details.name}</div>
                    <div className="text-sm">₹{details.price}</div>
                    <div className="text-xs">
                      {isShowSoldOut(selectedMovie, type) ? 'Sold Out' : `${details.capacity} seats available`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Food Selection */}
          {selectedScreenType && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Add Food & Beverages (Optional)</label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(FOOD_ITEMS).map(([id, item]) => (
                  <button
                    key={id}
                    className={`p-4 border rounded ${selectedFood.includes(id) ? 'bg-green-100 border-green-500' : ''}`}
                    onClick={() => {
                      setSelectedFood(prev => 
                        prev.includes(id) 
                          ? prev.filter(f => f !== id)
                          : [...prev, id]
                      );
                    }}
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm">₹{item.price}</div>
                  </button>
                ))}
              </div>
              {selectedScreenType && selectedFood.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Food discount: {(SCREEN_TYPES[selectedScreenType].foodDiscount * 100)}%
                </div>
              )}
            </div>
          )}

          {/* Total and Book Button */}
          {selectedScreenType && (
            <div className="mt-6">
              <div className="text-xl font-bold mb-4">
                Total: ₹{calculateTotal().toFixed(2)}
              </div>
              <button
                className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
                onClick={handleBooking}
              >
                Book Now
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Status */}
      {bookingStatus && (
        <Alert className={`mb-6 ${
          bookingStatus.type === 'success' ? 'bg-green-50' :
          bookingStatus.type === 'error' ? 'bg-red-50' :
          'bg-yellow-50'
        }`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {bookingStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Bookings */}
      {bookings.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.map(booking => {
                const theater = THEATERS.find(t => t.id === booking.theaterId);
                const movie = theater.movies.find(m => m.id === booking.movieId);
                return (
                  <div key={booking.id} className="border p-4 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Film className="h-4 w-4" />
                          <span className="font-medium">{movie.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{theater.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(movie.showTime).toLocaleString()}</span>
                        </div>
                        {booking.food.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Coffee className="h-4 w-4" />
                            <span>{booking.food.map(f => FOOD_ITEMS[f].name).join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        onClick={() => handleCancellation(booking.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waiting List */}
      {waitingList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Waiting List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {waitingList.map(booking => {
                const theater = THEATERS.find(t => t.id === booking.theaterId);
                const movie = theater.movies.find(m => m.id === booking.movieId);
                return (
                  <div key={booking.id} className="border p-4 rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{movie.name}</span>
                      <span className="text-sm text-gray-600">
                        at {theater.name} ({SCREEN_TYPES[booking.screenType].name})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MovieBookingSystem;