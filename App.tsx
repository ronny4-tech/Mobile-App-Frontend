import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { 
  Home, Search, Heart, User, MapPin, Star, 
  ArrowLeft, Plus, LogOut, Compass, Landmark, 
  Trees, Palmtree, ChevronRight, Map, Info,
  Sliders, Bell, ShieldCheck, Clock
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// ==========================================
// 🔴 CONFIGURATION: SET YOUR BACKEND URL HERE
// ==========================================
// Replace with your local machine's IP address (e.g., 'http://192.168.1.50:5000') 
// if you are testing on a real physical mobile device!
const API_URL = 'http://172.20.10.4:8080'; // Default Android Emulator Loopback Address

interface Attraction {
  id: string;
  _id?: string; // Fallback helper for MongoDB object IDs
  name: string;
  region: string;
  rating: string;
  reviews: string;
  image: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  price: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('SPLASH');
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Booking Form Form State
  const [visitors, setVisitors] = useState<number>(2);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>('');

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Fetch Attractions From Your Backend dynamically
  const fetchAttractions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/attractions`);
      const data = await response.json();
      
      // Standardize data parsing just in case backend wraps it in an object property
      const parsedAttractions = Array.isArray(data) ? data : data.attractions || [];
      
      setAttractions(parsedAttractions);
      if (parsedAttractions.length > 0) {
        setSelectedAttraction(parsedAttractions[0]);
      }
    } catch (error) {
      console.error("Backend connection error: ", error);
      Alert.alert(
        "Connection Error", 
        "Could not load data from your backend. Please make sure your server is running and the API_URL configuration matches."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttractions();
    
    if (currentScreen === 'SPLASH') {
      const timer = setTimeout(() => setCurrentScreen('HOME'), 2200);
      return () => clearTimeout(timer);
    }
  }, []);

  // 2. Handle Booking Submissions to Backend Route
  const handleBookingSubmit = async () => {
    if (!fullName || !phone || !email || !visitDate) {
      Alert.alert("Error", "Please fill out all mandatory fields before booking.");
      return;
    }

    try {
      const payload = {
        attractionId: selectedAttraction?.id || selectedAttraction?._id,
        attractionName: selectedAttraction?.name,
        fullName,
        phone,
        email,
        visitDate,
        visitors
      };

      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Alert.alert('Success', 'Your booking request was successfully saved to the backend database!');
        // Clear inputs safely
        setFullName('');
        setPhone('');
        setEmail('');
        setVisitDate('');
        setCurrentScreen('HOME');
      } else {
        Alert.alert('Booking Failed', 'The server rejected this request. Verify your endpoint setup.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to reach backend booking system. Using network offline fail-safes.');
    }
  };

  const filteredAttractions = attractions.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.region?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (currentScreen === 'SPLASH') {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.splashContent}>
          <Text style={styles.splashLogo}>DeTour <Text style={{color: '#FFCC00'}}>📍</Text></Text>
          <Text style={styles.splashSubtitle}>Explore Ghana</Text>
          <View style={styles.monumentContainer}>
            <View style={styles.archTop} />
            <View style={styles.archRow}>
              <View style={styles.archPillar} />
              <View style={styles.archPillar} />
            </View>
            <Text style={styles.archText}>FREEDOM AND JUSTICE</Text>
          </View>
        </View>
        <View style={styles.flagRibbon}>
          <View style={[styles.flagStrip, {backgroundColor: '#D11919'}]} />
          <View style={[styles.flagStrip, {backgroundColor: '#FFCC00'}]} />
          <View style={[styles.flagStrip, {backgroundColor: '#006B3F'}]} />
        </View>
        <Text style={styles.loadingText}>Connecting to backend server...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.mainContent}>
        
        {/* 1. HOME SCREEN */}
        {currentScreen === 'HOME' && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.screenScroll}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerLogo}>DeTour <Text style={styles.flagEmoji}>🇬🇭</Text></Text>
                <Text style={styles.headerSub}>Welcome back,</Text>
                <Text style={styles.headerTitle}>Explore the beauty of Ghana</Text>
              </View>
              <TouchableOpacity style={styles.iconCircle} onPress={() => setCurrentScreen('ADMIN')}>
                <Plus size={20} color="#054A29" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
              <TextInput 
                placeholder="Search attractions, regions..." 
                style={styles.searchInput} 
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.filterButtonInside}>
                <Sliders size={18} color="#054A29" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchButton}>
                <Search size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <Text style={styles.seeAllText}>See all</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
              {[
                { label: 'Beaches', icon: <Palmtree size={20} color="#054A29" />, key: 'Beaches' },
                { label: 'Parks', icon: <Trees size={20} color="#054A29" />, key: 'Parks' },
                { label: 'Museums', icon: <Landmark size={20} color="#054A29" />, key: 'Museums' },
                { label: 'Culture', icon: <Compass size={20} color="#054A29" />, key: 'Culture' },
              ].map((cat, i) => {
                const isSelected = activeCategory === cat.key;
                return (
                  <TouchableOpacity key={i} style={styles.catCard} onPress={() => setActiveCategory(isSelected ? 'All' : cat.key)}>
                    <View style={[styles.catIconContainer, isSelected && { backgroundColor: '#FFCC00' }]}>
                      {cat.icon}
                    </View>
                    <Text style={styles.catText}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Featured Attractions</Text>
              <TouchableOpacity onPress={fetchAttractions}><Text style={styles.seeAllText}>Refresh 🔄</Text></TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color="#054A29" style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredRow}>
                {filteredAttractions.map((item) => (
                  <TouchableOpacity key={item.id || item._id} style={styles.featuredCard} onPress={() => { setSelectedAttraction(item); setCurrentScreen('DETAILS'); }}>
                    <Image source={{ uri: item.image }} style={styles.featuredImg} />
                    <Text style={styles.featuredName}>{item.name}</Text>
                    <View style={styles.featuredMeta}>
                      <Text style={styles.featuredRegion}>{item.region}</Text>
                      <View style={styles.ratingBox}>
                        <Star size={12} color="#FFCC00" fill="#FFCC00" />
                        <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.travelNoticeCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>Ghana Travel Guide</Text>
                <Text style={styles.noticeBody}>Ensure you carry local GH₵ currency when heading out to rural parks or waterfall reserves.</Text>
              </View>
              <Bell size={24} color="#054A29" style={{ marginLeft: 10 }} />
            </View>
          </ScrollView>
        )}

        {/* 2. MAP VIEW */}
        {currentScreen === 'MAP' && (
          <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
            <View style={styles.mapFloatingHeader}>
              <Text style={styles.mapHeaderTitle}>Interactive Ghana Map</Text>
              <Text style={styles.mapHeaderSub}>Select markers to reveal travel hubs across coordinates</Text>
            </View>

            <View style={styles.mapGridContainer}>
              <View style={styles.mapGridLineH} />
              <View style={[styles.mapGridLineH, { top: '66%' }]} />
              <View style={styles.mapGridLineV} />
              <View style={[styles.mapGridLineV, { left: '66%' }]} />

              {attractions.map((pin) => {
                const isActive = selectedAttraction?.id === pin.id || selectedAttraction?._id === pin._id;
                const topPercent = `${Math.min(85, Math.max(15, (10 - (pin.lat || 5)) * 12 + 20))}%`;
                const leftPercent = `${Math.min(85, Math.max(15, ((pin.lng || -1) + 3) * 18 + 30))}%`;

                return (
                  <TouchableOpacity 
                    key={pin.id || pin._id} 
                    style={[styles.mapMarkerPin, { top: topPercent as any, left: leftPercent as any }]}
                    onPress={() => setSelectedAttraction(pin)}
                  >
                    <MapPin size={isActive ? 34 : 26} color={isActive ? '#FFCC00' : '#054A29'} fill={isActive ? '#054A29' : 'rgba(5,74,41,0.2)'} />
                    <View style={[styles.mapPinTag, isActive && { backgroundColor: '#054A29' }]}>
                      <Text style={[styles.mapPinTagText, isActive && { color: '#FFF' }]}>{pin.name?.split(' ')[0]}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedAttraction && (
              <View style={styles.mapPreviewCardContainer}>
                <TouchableOpacity style={styles.mapPreviewCard} onPress={() => setCurrentScreen('DETAILS')}>
                  <Image source={{ uri: selectedAttraction.image }} style={styles.mapPreviewImage} />
                  <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <Text style={styles.mapPreviewName}>{selectedAttraction.name}</Text>
                    <Text style={styles.mapPreviewRegion}>{selectedAttraction.region}</Text>
                    <View style={[styles.ratingBox, { marginTop: 4 }]}>
                      <Star size={12} color="#FFCC00" fill="#FFCC00" />
                      <Text style={styles.ratingText}>{selectedAttraction.rating || '4.5'} ({selectedAttraction.reviews || '10'})</Text>
                    </View>
                  </View>
                  <View style={styles.mapInfoCircle}><Info size={16} color="#054A29" /></View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 3. ATTRACTION DETAILS */}
        {currentScreen === 'DETAILS' && selectedAttraction && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: '#FFF' }}>
            <View style={{ position: 'relative' }}>
              <Image source={{ uri: selectedAttraction.image }} style={styles.detailsHeroImage} />
              <TouchableOpacity style={styles.backButtonFloating} onPress={() => setCurrentScreen('HOME')}>
                <ArrowLeft size={20} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heartButtonFloating}>
                <Heart size={20} color="red" fill="red" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsCardBody}>
              <View style={styles.detailsTitleRow}>
                <Text style={styles.detailsTitle}>{selectedAttraction.name}</Text>
                <View style={styles.detailsRatingBadge}>
                  <Star size={14} color="#FFCC00" fill="#FFCC00" />
                  <Text style={styles.detailsRatingText}>{selectedAttraction.rating || '4.5'} ({selectedAttraction.reviews || '25'} reviews)</Text>
                </View>
              </View>

              <View style={styles.detailsLocationRow}>
                <MapPin size={16} color="#054A29" />
                <Text style={styles.detailsLocText}>{selectedAttraction.region}</Text>
                <TouchableOpacity style={styles.mapBadgeLink} onPress={() => setCurrentScreen('MAP')}>
                  <Text style={styles.mapBadgeLinkText}>See Map</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.detailsDesc}>{selectedAttraction.description}</Text>

              <Text style={styles.subLabelTitle}>Facilities</Text>
              <View style={styles.facilitiesContainer}>
                {[
                  { label: 'Guided Tours', icon: <Compass size={14} color="#555" /> },
                  { label: 'Museum', icon: <Landmark size={14} color="#555" /> },
                  { label: 'Parking', icon: <ShieldCheck size={14} color="#555" /> },
                  { label: 'Restroom', icon: <User size={14} color="#555" /> }
                ].map((fac, idx) => (
                  <View key={idx} style={styles.facilityBadge}>
                    {fac.icon}
                    <Text style={styles.facilityText}>{fac.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.subLabelTitle}>Opening Hours</Text>
              <View style={styles.hoursRowContainer}>
                <Clock size={16} color="#666" />
                <Text style={styles.hoursText}>Mon - Sun: 8:00 AM - 5:00 PM</Text>
              </View>

              <View style={styles.actionStickyBottom}>
                <View>
                  <Text style={styles.stickyPriceLabel}>Ticket Price</Text>
                  <Text style={styles.stickyPriceVal}>{selectedAttraction.price || 'GH₵ 50'}</Text>
                </View>
                <TouchableOpacity style={styles.detailsBookBtn} onPress={() => setCurrentScreen('BOOKING')}>
                  <Text style={styles.primaryButtonText}>Book Visit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* 4. BOOKING SCREEN */}
        {currentScreen === 'BOOKING' && selectedAttraction && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.screenScroll}>
            <View style={styles.headerWithBack}>
              <TouchableOpacity onPress={() => setCurrentScreen('DETAILS')}><ArrowLeft size={22} color="#000" /></TouchableOpacity>
              <Text style={styles.centerHeaderTitle}>Book Your Visit</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.bookingSummaryCard}>
              <Image source={{ uri: selectedAttraction.image }} style={styles.miniThumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.miniTitle}>{selectedAttraction.name}</Text>
                <Text style={styles.miniRegion}>{selectedAttraction.region}</Text>
              </View>
              <View style={styles.ratingBox}>
                <Star size={12} color="#FFCC00" fill="#FFCC00"/>
                <Text style={styles.ratingText}>{selectedAttraction.rating || '4.5'}</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput style={styles.formInput} placeholder="Enter your full name" placeholderTextColor="#aaa" value={fullName} onChangeText={setFullName} />
              
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput style={styles.formInput} placeholder="Enter your phone number" keyboardType="phone-pad" placeholderTextColor="#aaa" value={phone} onChangeText={setPhone} />
              
              <Text style={styles.formLabel}>Email Address</Text>
              <TextInput style={styles.formInput} placeholder="Enter your email" keyboardType="email-address" placeholderTextColor="#aaa" value={email} onChangeText={setEmail} />
              
              <Text style={styles.formLabel}>Visit Date</Text>
              <TextInput style={styles.formInput} placeholder="YYYY-MM-DD" placeholderTextColor="#aaa" value={visitDate} onChangeText={setVisitDate} />
              
              <Text style={styles.formLabel}>Number of Visitors</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setVisitors(Math.max(1, visitors - 1))}><Text style={styles.counterBtnText}>-</Text></TouchableOpacity>
                <Text style={styles.counterVal}>{visitors}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setVisitors(visitors + 1)}><Text style={styles.counterBtnText}>+</Text></TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleBookingSubmit}>
              <Text style={styles.primaryButtonText}>Confirm Booking</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>All registrations route directly to database services</Text>
          </ScrollView>
        )}

        {/* 5. SEARCH SCREEN */}
        {currentScreen === 'SEARCH' && (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <View style={styles.searchBarContainer}>
              <TextInput 
                placeholder="Search attractions..." 
                style={styles.searchInput} 
                autoFocus={true} 
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <View style={styles.searchButton}><Search size={18} color="#fff" /></View>
            </View>

            <Text style={styles.subLabelTitle}>Popular Searches</Text>
            <View style={styles.tagCloud}>
              {['Castle', 'Park', 'Beach', 'Museum', 'Culture'].map((tag, i) => (
                <TouchableOpacity key={i} onPress={() => setSearchQuery(tag)}><Text style={styles.tagItem}>{tag}</Text></TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subLabelTitle}>All Dynamic Attractions ({filteredAttractions.length})</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredAttractions.map(item => (
                <TouchableOpacity key={item.id || item._id} style={styles.listItem} onPress={() => { setSelectedAttraction(item); setCurrentScreen('DETAILS'); }}>
                  <Image source={{ uri: item.image }} style={styles.listThumb} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.listTitle}>{item.name}</Text>
                    <Text style={styles.listSub}>{item.region}</Text>
                  </View>
                  <ChevronRight size={18} color="#ccc" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 6. FAVORITES SCREEN */}
        {currentScreen === 'FAVORITES' && (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <Text style={styles.screenHeadingCenter}>My Favorites</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {attractions.slice(0, 3).map(item => (
                <View key={item.id || item._id} style={styles.listItem}>
                  <Image source={{ uri: item.image }} style={styles.listThumb} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.listTitle}>{item.name}</Text>
                    <Text style={styles.listSub}>{item.region}</Text>
                  </View>
                  <Heart size={20} color="red" fill="red" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 7. PROFILE SCREEN */}
        {currentScreen === 'PROFILE' && (
          <View style={{ flex: 1 }}>
            <View style={styles.profileHeaderBg}>
              <View style={styles.avatarContainer}><Text style={styles.avatarText}>RM</Text></View>
              <Text style={styles.profileName}>Ronny Mensah</Text>
              <Text style={styles.profileEmail}>ronny.mensah@email.com</Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}><Text style={styles.statNum}>3</Text><Text style={styles.statLabel}>Bookings</Text></View>
                <View style={styles.statBox}><Text style={styles.statNum}>5</Text><Text style={styles.statLabel}>Favorites</Text></View>
                <View style={styles.statBox}><Text style={styles.statNum}>2</Text><Text style={styles.statLabel}>Reviews</Text></View>
              </View>
            </View>

            <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {['Personal Information', 'My Bookings', 'Payment Methods', 'Settings', 'Help & Support'].map((opt, i) => (
                <TouchableOpacity key={i} style={styles.profileMenuRow}>
                  <Text style={styles.profileMenuText}>{opt}</Text>
                  <ChevronRight size={18} color="#999" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.profileMenuRow, { borderBottomWidth: 0 }]} onPress={() => setCurrentScreen('SPLASH')}>
                <Text style={[styles.profileMenuText, { color: 'red' }]}>Logout</Text>
                <LogOut size={18} color="red" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* 8. ADMIN SCREEN */}
        {currentScreen === 'ADMIN' && (
          <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.headerWithBack}>
              <TouchableOpacity onPress={() => setCurrentScreen('HOME')}><ArrowLeft size={22} color="#000" /></TouchableOpacity>
              <Text style={styles.centerHeaderTitle}>Admin - Add Attraction</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Attraction Name</Text>
              <TextInput style={styles.formInput} placeholder="Enter attraction name" placeholderTextColor="#aaa" />
              
              <Text style={styles.formLabel}>Region</Text>
              <TextInput style={styles.formInput} placeholder="Enter region" placeholderTextColor="#aaa" />
              
              <Text style={styles.formLabel}>Description</Text>
              <TextInput style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]} placeholder="Enter description" multiline placeholderTextColor="#aaa" />
              
              <Text style={styles.formLabel}>Image URL</Text>
              <TextInput style={styles.formInput} placeholder="Enter image URL" placeholderTextColor="#aaa" />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentScreen('HOME')}>
              <Text style={styles.primaryButtonText}>Save Attraction</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

      </View>

      {/* COMPACT BOTTOM NAVBAR */}
      {currentScreen !== 'SPLASH' && (
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('HOME')}>
            <Home size={22} color={currentScreen === 'HOME' ? '#054A29' : '#999'} />
            <Text style={[styles.navText, currentScreen === 'HOME' && styles.navTextActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('MAP')}>
            <Map size={22} color={currentScreen === 'MAP' ? '#054A29' : '#999'} />
            <Text style={[styles.navText, currentScreen === 'MAP' && styles.navTextActive]}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('SEARCH')}>
            <Search size={22} color={currentScreen === 'SEARCH' ? '#054A29' : '#999'} />
            <Text style={[styles.navText, currentScreen === 'SEARCH' && styles.navTextActive]}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('FAVORITES')}>
            <Heart size={22} color={currentScreen === 'FAVORITES' ? '#054A29' : '#999'} />
            <Text style={[styles.navText, currentScreen === 'FAVORITES' && styles.navTextActive]}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('PROFILE')}>
            <User size={22} color={currentScreen === 'PROFILE' ? '#054A29' : '#999'} />
            <Text style={[styles.navText, currentScreen === 'PROFILE' && styles.navTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  splashContainer: {
    flex: 1, 
    backgroundColor: '#054A29', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  mainContent: {
    flex: 1,
  },
  screenScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  splashContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  splashLogo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
  },
  splashSubtitle: {
    fontSize: 18,
    color: '#E0E0E0',
    letterSpacing: 2,
    marginBottom: 40,
  },
  monumentContainer: {
    width: 200,
    height: 160,
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  archTop: {
    width: 160,
    height: 25,
    backgroundColor: '#FFF',
    position: 'absolute',
    top: 25,
  },
  archRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
    height: 70,
  },
  archPillar: {
    width: 30,
    backgroundColor: '#FFF',
  },
  archText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 15,
  },
  flagRibbon: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    height: 30,
  },
  flagStrip: {
    flex: 1,
  },
  loadingText: {
    position: 'absolute',
    bottom: 50,
    color: '#FFF',
    fontSize: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  headerLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#054A29',
  },
  flagEmoji: {
    fontSize: 20,
  },
  headerSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F5F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    paddingLeft: 15,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: '#333',
  },
  filterButtonInside: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  searchButton: {
    backgroundColor: '#054A29',
    height: 46,
    width: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  seeAllText: {
    fontSize: 13,
    color: '#054A29',
    fontWeight: '600',
  },
  categoriesRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  catCard: {
    alignItems: 'center',
    marginRight: 24,
  },
  catIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 16,
    backgroundColor: '#F0F5F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  catText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  featuredRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  featuredCard: {
    width: width * 0.6,
    marginRight: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    paddingBottom: 8,
  },
  featuredImg: {
    width: '100%',
    height: 130,
    backgroundColor: '#DDD',
  },
  featuredName: {
    fontSize: 14,
    fontWeight: 'bold',
    padding: 10,
    paddingBottom: 2,
    color: '#222',
  },
  featuredMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  featuredRegion: {
    fontSize: 12,
    color: '#666',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#333',
  },
  travelNoticeCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F5F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#054A29',
    marginBottom: 4,
  },
  noticeBody: {
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
  },
  subLabelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 20,
    marginBottom: 10,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  facilityText: {
    fontSize: 12,
    color: '#444',
    marginLeft: 6,
  },
  hoursRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  hoursText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  actionStickyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#EEE',
    paddingTop: 15,
    marginTop: 10,
  },
  stickyPriceLabel: {
    fontSize: 12,
    color: '#666',
  },
  stickyPriceVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#054A29',
  },
  detailsBookBtn: {
    backgroundColor: '#054A29',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },

  // Interactive Map Screen Styles
  mapFloatingHeader: {
    position: 'absolute',
    top: 15,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    padding: 12,
    zIndex: 10,
  },
  mapHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#054A29',
  },
  mapHeaderSub: {
    fontSize: 11,
    color: '#666',
  },
  mapGridContainer: {
    flex: 1,
    position: 'relative',
  },
  mapGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  mapGridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '33%',
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  mapMarkerPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  mapPinTag: {
    backgroundColor: '#FFF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#054A29',
    marginTop: 2,
  },
  mapPinTagText: {
    fontSize: 9,
    color: '#054A29',
    fontWeight: 'bold',
  },
  mapPreviewCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  mapPreviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  mapPreviewName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  mapPreviewRegion: {
    fontSize: 11,
    color: '#666',
  },
  mapInfoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F5F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dynamic Details Screen Styles
  detailsHeroImage: {
    width: '100%',
    height: 270,
  },
  backButtonFloating: {
    position: 'absolute',
    top: 20,
    left: 16,
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 20,
  },
  heartButtonFloating: {
    position: 'absolute',
    top: 20,
    right: 16,
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 20,
  },
  detailsCardBody: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  detailsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    flex: 1,
    marginRight: 10,
  },
  detailsRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailsRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#B38600',
  },
  detailsLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  detailsLocText: {
    color: '#666',
    marginLeft: 4,
    fontSize: 14,
  },
  mapBadgeLink: {
    marginLeft: 10,
    backgroundColor: '#E6F4ED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mapBadgeLinkText: {
    fontSize: 11,
    color: '#054A29',
    fontWeight: 'bold',
  },
  detailsDesc: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 15,
  },

  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  centerHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  screenHeadingCenter: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
  },
  bookingSummaryCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  miniThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  miniRegion: {
    fontSize: 12,
    color: '#666',
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtn: {
    borderWidth: 1,
    borderColor: '#DDD',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  counterVal: {
    marginHorizontal: 20,
    fontSize: 16,
    fontWeight: 'bold',
  },
  helperText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginBottom: 30,
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  tagItem: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 13,
    color: '#555',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  listSub: {
    fontSize: 12,
    color: '#777',
  },
  profileHeaderBg: {
    backgroundColor: '#054A29',
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFCC00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#054A29',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileEmail: {
    fontSize: 12,
    color: '#CCC',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  profileMenuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    alignItems: 'center',
  },
  profileMenuText: {
    fontSize: 14,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#054A29',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFF',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  navTextActive: {
    color: '#054A29',
    fontWeight: '600',
  },
});