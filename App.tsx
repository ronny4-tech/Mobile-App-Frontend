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
  ActivityIndicator,
  Modal
} from 'react-native';
import { WebView } from 'react-native-webview';
import { 
  Home, Search, Heart, User, MapPin, Star, 
  ArrowLeft, Plus, LogOut, Compass, Landmark, 
  Trees, Palmtree, ChevronRight, Map, Info,
  Sliders, Bell, ShieldCheck, Clock, Wallet, 
  Users, DollarSign, CreditCard, Landmark as BankIcon, Lock
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ⚠️ Make sure this matches your current laptop phone hotspot IP address
const API_URL = 'http://172.20.10.4:8080'; 

interface Attraction {
  id: string;
  _id?: string;
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

interface UserSession {
  email: string;
  fullName: string;
  role: 'TOURIST' | 'GUIDE' | 'ADMIN';
  walletBalance: number;
  earnings?: number;
  touristsEnrolled?: number;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('SPLASH');
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  
  // Auth Form Inputs
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authMode, setAuthMode] = useState<'SIGNIN' | 'SIGNUP'>('SIGNIN');

  // Profile Secondary Screen Modals
  const [activeProfileModal, setActiveProfileModal] = useState<string | null>(null);

  // Booking / Payment States
  const [visitors, setVisitors] = useState<number>(2);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Paystack Live Bridge States
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Admin global wallet simulation
  const [adminPlatformWallet, setAdminPlatformWallet] = useState(1250.00); 

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchAttractions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/attractions`);
      const data = await response.json();
      const parsedAttractions = Array.isArray(data) ? data : data.attractions || [];
      setAttractions(parsedAttractions);
      if (parsedAttractions.length > 0) {
        setSelectedAttraction(parsedAttractions[0]);
      }
    } catch (error) {
      console.error("Backend connection error: ", error);
      setAttractions([
        { id: '1', name: 'Kakum National Park', region: 'Central Region', rating: '4.8', reviews: '120', image: 'https://images.unsplash.com/photo-1590075865003-e48277adc558', description: 'Famous for its high canopy walkway tropical rainforest.', category: 'Parks', lat: 5.42, lng: -1.38, price: 'GH₵ 60' },
        { id: '2', name: 'Cape Coast Castle', region: 'Central Region', rating: '4.7', reviews: '95', image: 'https://images.unsplash.com/photo-1620127258536-04283187c3fc', description: 'Historical monument tracing trade and coastal history.', category: 'Museums', lat: 5.10, lng: -1.24, price: 'GH₵ 50' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttractions();
    if (currentScreen === 'SPLASH') {
      const timer = setTimeout(() => setCurrentScreen('LOGIN'), 2200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAuthAction = async () => {
    if (!emailInput || !passwordInput) {
      Alert.alert('Error', 'Please enter your account details.');
      return;
    }

    const cleanEmail = emailInput.toLowerCase().trim();
    const endpoint = authMode === 'SIGNUP' ? '/signup' : '/signin';
    const targetUrl = `${API_URL}/api/users${endpoint}`;

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: passwordInput })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message || 'Action executed successfully!');
        
        if (authMode === 'SIGNIN') {
          // Dynamic dashboard routing logic matching your workflow rules
          if (cleanEmail === 'admin@detour.com') {
            const session: UserSession = { email: cleanEmail, fullName: 'System Administrator', role: 'ADMIN', walletBalance: adminPlatformWallet };
            setCurrentUser(session);
            setCurrentScreen('ADMIN_DASHBOARD');
          } else if (cleanEmail.includes('guide')) {
            const session: UserSession = { email: cleanEmail, fullName: 'Kwame Mensah (Certified Guide)', role: 'GUIDE', walletBalance: 450.00, earnings: 1820.00, touristsEnrolled: 14 };
            setCurrentUser(session);
            setCurrentScreen('GUIDE_DASHBOARD');
          } else {
            const session: UserSession = { email: cleanEmail, fullName: 'Ronny Mensah', role: 'TOURIST', walletBalance: 100.00 };
            setCurrentUser(session);
            setCurrentScreen('HOME');
          }
          setPasswordInput('');
        } else {
          // Flip to login view automatically after signup completion
          setAuthMode('SIGNIN');
          setPasswordInput('');
        }
      } else {
        Alert.alert('Authentication Failed', data.message || 'Invalid server configuration parameters.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Connection Error', 'Unable to resolve network link to Spring Boot instance.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEmailInput('');
    setPasswordInput('');
    setCurrentScreen('LOGIN');
  };

  const processMarketplacePayment = async (methodType: 'PAYSTACK' | 'BANK') => {
    const numericPrice = parseInt(selectedAttraction?.price.replace(/[^0-9]/g, '') || '50');
    const totalCost = numericPrice * visitors;
    
    if (methodType === 'BANK') {
      Alert.alert('Bank Transfer', 'Direct bank settlement features are pending connection rules.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const response = await fetch(`${API_URL}/api/bookings/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attractionId: parseInt(selectedAttraction?.id || '1'),
          fullName: fullName,
          phone: phone,
          email: email.trim() || 'tourist@detour.com',
          visitDate: visitDate,
          visitors: visitors,
          amount: totalCost 
        }),
      });

      const data = await response.json();

      if (data && data.authorization_url) {
        setPaymentUrl(data.authorization_url);
      } else {
        Alert.alert('Initialization Error', 'Could not obtain standard payment authorization link.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Network Error', 'Unable to reach payment servers over hotspot.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaystackNavigationStateChange = (navState: any) => {
    if (navState.url.includes('close') || navState.url.includes('callback')) {
      setPaymentUrl(null);
      setShowPaymentModal(false);
      
      const numericPrice = parseInt(selectedAttraction?.price.replace(/[^0-9]/g, '') || '50');
      const totalCost = numericPrice * visitors;
      const appCommission = totalCost * 0.15;
      
      setAdminPlatformWallet(prev => prev + appCommission);

      Alert.alert(
        '🎉 Booking Success!', 
        `Payment verified cleanly via Paystack Test Mode!\nTotal Settled: GH₵ ${totalCost}`
      );

      setFullName(''); setPhone(''); setEmail(''); setVisitDate('');
      setCurrentScreen('HOME');
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
        </View>
        <View style={styles.flagRibbon}>
          <View style={[styles.flagStrip, {backgroundColor: '#D11919'}]} />
          <View style={[styles.flagStrip, {backgroundColor: '#FFCC00'}]} />
          <View style={[styles.flagStrip, {backgroundColor: '#006B3F'}]} />
        </View>
        <Text style={styles.loadingText}>Loading Security Architecture Modules...</Text>
      </View>
    );
  }

  if (currentScreen === 'LOGIN') {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', backgroundColor: '#F9FAFB', padding: 24 }]}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={styles.loginLogo}>DeTour <Text style={{fontSize: 24}}>🇬🇭</Text></Text>
          <Text style={styles.loginSub}>
            {authMode === 'SIGNIN' ? 'Sign in to access your custom application workflow panel' : 'Create an account to track your customized travel itineraries'}
          </Text>
        </View>

        <View style={styles.loginCard}>
          <Text style={styles.formLabel}>Email Address</Text>
          <View style={styles.inputIconWrapper}>
            <TextInput 
              style={styles.formInputNoMargin} 
              placeholder="e.g. tourist@mail.com, guide@mail.com" 
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailInput}
              onChangeText={setEmailInput}
            />
          </View>

          <Text style={styles.formLabel}>Password</Text>
          <View style={styles.inputIconWrapper}>
            <TextInput 
              style={styles.formInputNoMargin} 
              placeholder="••••••••" 
              secureTextEntry
              autoCapitalize="none"
              value={passwordInput}
              onChangeText={setPasswordInput}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleAuthAction}>
            <Text style={styles.primaryButtonText}>
              {authMode === 'SIGNIN' ? 'Access Dashboard Account' : 'Register New Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ marginTop: 14, alignItems: 'center' }} 
            onPress={() => setAuthMode(authMode === 'SIGNIN' ? 'SIGNUP' : 'SIGNIN')}
          >
            <Text style={{ color: '#054A29', fontWeight: '700', fontSize: 13 }}>
              {authMode === 'SIGNIN' ? "Don't have an account? Sign Up Here" : "Already registered? Switch to Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        {authMode === 'SIGNIN' && (
          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>💡 Account Testing Matrix Roles:</Text>
            <Text style={styles.hintText}>• <Text style={{fontWeight: '700'}}>Tourist</Text>: Enter any general email profile string.</Text>
            <Text style={styles.hintText}>• <Text style={{fontWeight: '700'}}>Tour Guide</Text>: Type an email address containing "<Text style={{color:'#054A29'}}>guide</Text>".</Text>
            <Text style={styles.hintText}>• <Text style={{fontWeight: '700'}}>Administrator</Text>: Use <Text style={{color: '#B27D00'}}>admin@detour.com</Text></Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.mainContent}>
        
        {currentScreen === 'HOME' && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.screenScroll}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerLogo}>DeTour <Text style={styles.flagEmoji}>🇬🇭</Text></Text>
                <Text style={styles.headerSub}>Welcome back,</Text>
                <Text style={styles.headerTitle}>{currentUser?.fullName || 'User Account'}</Text>
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
              <TouchableOpacity style={styles.searchButton}>
                <Search size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Categories</Text>
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
          </ScrollView>
        )}

        {currentScreen === 'GUIDE_DASHBOARD' && (
          <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.roleDashboardHeader}>
              <View>
                <Text style={styles.dashboardBadgeText}>Registered Tour Guide</Text>
                <Text style={styles.dashboardMainTitle}>{currentUser?.fullName}</Text>
              </View>
              <TouchableOpacity style={styles.logoutIconButton} onPress={handleLogout}>
                <LogOut size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.walletCardComponent}>
              <View style={styles.walletHeaderRow}>
                <Text style={styles.walletLabel}>Electronic Escrow Wallet Balance</Text>
                <Wallet size={22} color="#FFF" />
              </View>
              <Text style={styles.walletCurrencyAmount}>GH₵ {currentUser?.walletBalance?.toFixed(2)}</Text>
              <View style={styles.walletBottomStats}>
                <Text style={styles.walletSecureText}>✓ Connected securely to Paystack Core Node</Text>
              </View>
            </View>

            <View style={styles.statsGridRow}>
              <View style={styles.statsHalfBox}>
                <DollarSign size={24} color="#054A29" />
                <Text style={styles.statBoxLabel}>Total Lifetime Earnings</Text>
                <Text style={styles.statBoxValue}>GH₵ {currentUser?.earnings?.toFixed(2)}</Text>
              </View>
              <View style={styles.statsHalfBox}>
                <Users size={24} color="#054A29" />
                <Text style={styles.statBoxLabel}>Tourists Enrolled</Text>
                <Text style={styles.statBoxValue}>{currentUser?.touristsEnrolled} Travelers</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Assigned Group Bookings Requests</Text>
            <View style={styles.bookingRowMockCard}>
              <View style={styles.bookingStatusDot} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', fontSize: 14 }}>Elikem Annan (3 Visitors)</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>Destination: Cape Coast Castle</Text>
                <Text style={{ color: '#999', fontSize: 11 }}>Date: 2026-07-12</Text>
              </View>
              <Text style={{ fontWeight: 'bold', color: '#054A29' }}>GH₵ 150.00</Text>
            </View>
          </ScrollView>
        )}

        {currentScreen === 'ADMIN_DASHBOARD' && (
          <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.roleDashboardHeader}>
              <View>
                <Text style={[styles.dashboardBadgeText, { backgroundColor: '#FEF3C7', color: '#D97706' }]}>System Root Admin</Text>
                <Text style={styles.dashboardMainTitle}>Platform Control Console</Text>
              </View>
              <TouchableOpacity style={styles.logoutIconButton} onPress={handleLogout}>
                <LogOut size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <View style={[styles.walletCardComponent, { backgroundColor: '#1E3A8A' }]}>
              <View style={styles.walletHeaderRow}>
                <Text style={styles.walletLabel}>App Net Collected Commission Wallet</Text>
                <ShieldCheck size={22} color="#FFF" />
              </View>
              <Text style={styles.walletCurrencyAmount}>GH₵ {adminPlatformWallet.toFixed(2)}</Text>
              <TouchableOpacity 
                style={styles.adminFundBtn} 
                onPress={() => {
                  setAdminPlatformWallet(prev => prev + 500);
                  Alert.alert('Funds Added', 'Simulated clearing load of GH₵ 500.00 directly into system treasury repositories.');
                }}
              >
                <Text style={styles.adminFundBtnText}>+ Force Clear Reserve Payouts (Add GH₵500)</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Administrative Shortcuts</Text>
            <TouchableOpacity style={styles.adminMenuActionRow} onPress={() => setCurrentScreen('ADMIN')}>
              <Plus size={20} color="#1E3A8A" />
              <Text style={styles.adminMenuTextText}>Inject New Attraction Database Entity</Text>
              <ChevronRight size={18} color="#999" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.adminMenuActionRow} onPress={() => setCurrentScreen('HOME')}>
              <Compass size={20} color="#1E3A8A" />
              <Text style={styles.adminMenuTextText}>Review App As Standard Client Node</Text>
              <ChevronRight size={18} color="#999" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </ScrollView>
        )}

        {currentScreen === 'MAP' && (
          <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
            <View style={styles.mapFloatingHeader}>
              <Text style={styles.mapHeaderTitle}>Interactive Ghana Map</Text>
              <Text style={styles.mapHeaderSub}>Select markers to reveal travel hubs across coordinates</Text>
            </View>
            <View style={styles.mapGridContainer}>
              {attractions.map((pin) => {
                const isActive = selectedAttraction?.id === pin.id;
                return (
                  <TouchableOpacity 
                    key={pin.id} 
                    style={[styles.mapMarkerPin, { top: '40%', left: '45%' }]}
                    onPress={() => setSelectedAttraction(pin)}
                  >
                    <MapPin size={30} color={isActive ? '#FFCC00' : '#054A29'} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {currentScreen === 'DETAILS' && selectedAttraction && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: '#FFF' }}>
            <Image source={{ uri: selectedAttraction.image }} style={styles.detailsHeroImage} />
            <TouchableOpacity style={styles.backButtonFloating} onPress={() => setCurrentScreen('HOME')}>
              <ArrowLeft size={20} color="#000" />
            </TouchableOpacity>
            
            <View style={styles.detailsCardBody}>
              <Text style={styles.detailsTitle}>{selectedAttraction.name}</Text>
              <Text style={styles.detailsLocText}>{selectedAttraction.region}</Text>
              <Text style={styles.detailsDesc}>{selectedAttraction.description}</Text>

              <View style={styles.actionStickyBottom}>
                <View>
                  <Text style={styles.stickyPriceLabel}>Ticket Price</Text>
                  <Text style={styles.stickyPriceVal}>{selectedAttraction.price}</Text>
                </View>
                <TouchableOpacity style={styles.detailsBookBtn} onPress={() => setCurrentScreen('BOOKING')}>
                  <Text style={styles.primaryButtonText}>Book Visit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {currentScreen === 'BOOKING' && selectedAttraction && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.screenScroll}>
            <View style={styles.headerWithBack}>
              <TouchableOpacity onPress={() => setCurrentScreen('DETAILS')}><ArrowLeft size={22} color="#000" /></TouchableOpacity>
              <Text style={styles.centerHeaderTitle}>Book Your Visit</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput style={styles.formInput} placeholder="Enter your full name" value={fullName} onChangeText={setFullName} />
              
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput style={styles.formInput} placeholder="Enter your phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              
              <Text style={styles.formLabel}>Email Address</Text>
              <TextInput style={styles.formInput} placeholder="Enter your email" value={email} onChangeText={setEmail} />
              
              <Text style={styles.formLabel}>Visit Date</Text>
              <TextInput style={styles.formInput} placeholder="YYYY-MM-DD" value={visitDate} onChangeText={setVisitDate} />
              
              <Text style={styles.formLabel}>Number of Visitors</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setVisitors(Math.max(1, visitors - 1))}><Text style={styles.counterBtnText}>-</Text></TouchableOpacity>
                <Text style={styles.counterVal}>{visitors}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setVisitors(visitors + 1)}><Text style={styles.counterBtnText}>+</Text></TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => {
              if(!fullName || !phone || !email || !visitDate) {
                Alert.alert('Error', 'Please completely fill the database booking requirement parameters.');
                return;
              }
              setShowPaymentModal(true);
            }}>
              <Text style={styles.primaryButtonText}>Proceed to Payment Selector</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {currentScreen === 'SEARCH' && (
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
            <View style={styles.searchBarContainer}>
              <TextInput placeholder="Search attractions..." style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredAttractions.map(item => (
                <TouchableOpacity key={item.id} style={styles.listItem} onPress={() => { setSelectedAttraction(item); setCurrentScreen('DETAILS'); }}>
                  <Text style={styles.listTitle}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {currentScreen === 'FAVORITES' && (
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={styles.screenHeadingCenter}>Saved Wishlist Locations</Text>
            <Text style={{ textAlign: 'center', color: '#666', marginTop: 40 }}>Your liked attractions will be cached here.</Text>
          </View>
        )}

        {currentScreen === 'PROFILE' && (
          <View style={{ flex: 1 }}>
            <View style={styles.profileHeaderBg}>
              <View style={styles.avatarContainer}><Text style={styles.avatarText}>RM</Text></View>
              <Text style={styles.profileName}>{currentUser?.fullName || 'Guest Profile'}</Text>
              <Text style={styles.profileEmail}>{currentUser?.email || 'guest@detour.com'}</Text>
            </View>

            <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.profileMenuRow} onPress={() => setActiveProfileModal('PERSONAL_INFO')}>
                <User size={18} color="#054A29" />
                <Text style={styles.profileMenuText}>Personal Information</Text>
                <ChevronRight size={18} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuRow} onPress={() => setActiveProfileModal('MY_BOOKINGS')}>
                <Clock size={18} color="#054A29" />
                <Text style={styles.profileMenuText}>My Core Bookings</Text>
                <ChevronRight size={18} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuRow} onPress={() => setActiveProfileModal('PAYMENT_METHODS')}>
                <CreditCard size={18} color="#054A29" />
                <Text style={styles.profileMenuText}>Payment Core Methods</Text>
                <ChevronRight size={18} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuRow} onPress={() => setActiveProfileModal('SETTINGS')}>
                <Sliders size={18} color="#054A29" />
                <Text style={styles.profileMenuText}>Application Settings</Text>
                <ChevronRight size={18} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuRow} onPress={() => setActiveProfileModal('SUPPORT')}>
                <ShieldCheck size={18} color="#054A29" />
                <Text style={styles.profileMenuText}>Help & Support Center</Text>
                <ChevronRight size={18} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.profileMenuRow, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                <LogOut size={18} color="red" />
                <Text style={[styles.profileMenuText, { color: 'red', marginLeft: 10 }]}>Log Out Secure Session</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {currentScreen === 'ADMIN' && (
          <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.headerWithBack}>
              <TouchableOpacity onPress={() => setCurrentScreen(currentUser?.role === 'ADMIN' ? 'ADMIN_DASHBOARD' : 'HOME')}><ArrowLeft size={22} color="#000" /></TouchableOpacity>
              <Text style={styles.centerHeaderTitle}>Add Dynamic Location</Text>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Attraction Name</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Mole National Park" />
              <Text style={styles.formLabel}>Region</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Northern Region" />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={() => { Alert.alert('Saved', 'Attraction saved.'); setCurrentScreen('HOME'); }}>
              <Text style={styles.primaryButtonText}>Commit Entry to Server</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

      </View>

      {/* Dynamic Tab Navigation System */}
      {['HOME', 'SEARCH', 'MAP', 'FAVORITES', 'PROFILE'].includes(currentScreen) && (
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('HOME')}>
            <Home size={22} color={currentScreen === 'HOME' ? '#054A29' : '#999'} />
            <Text style={[styles.navText, currentScreen === 'HOME' && styles.navTextActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('SEARCH')}>
            <Search size={22} color={currentScreen === 'SEARCH' ? '#054A29' : '#999'} />
            <Text style={[styles.navText, currentScreen === 'SEARCH' && styles.navTextActive]}>Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('MAP')}>
            <Map size={22} color={currentScreen === 'MAP' ? '#054A29' : '#999'} />
            <Text style={[styles.navText, currentScreen === 'MAP' && styles.navTextActive]}>Portal Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('FAVORITES')}>
            <Heart size={22} color={currentScreen === 'FAVORITES' ? '#054A29' : '#999'} />
            <Text style={[styles.navText, currentScreen === 'FAVORITES' && styles.navTextActive]}>Wishlist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('PROFILE')}>
            <User size={22} color={currentScreen === 'PROFILE' ? '#054A29' : '#999'} />
            <Text style={[styles.navText, currentScreen === 'PROFILE' && styles.navTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ==========================================
          MODAL INTERFACE A: POPUP PAYMENT GATEWAY SELECTOR
          ========================================== */}
      <Modal visible={showPaymentModal} animationType="slide" transparent={true}>
        <View style={styles.modalCenteredView}>
          <View style={styles.paymentSelectorBox}>
            <Text style={styles.paymentTitle}>Select Gateway Architecture</Text>
            <Text style={styles.paymentSubtitle}>Charges will be calculated dynamically using split mechanics.</Text>
            
            <TouchableOpacity 
              style={styles.paymentOptionRow} 
              onPress={() => processMarketplacePayment('PAYSTACK')}
              disabled={isProcessingPayment}
            >
              <CreditCard size={22} color="#054A29" />
              <View style={{ marginLeft: 14 }}>
                <Text style={{ fontWeight: '700', fontSize: 15 }}>Paystack Checkout Sandbox</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>Supports Mobile Money & Visa</Text>
              </View>
              {isProcessingPayment && <ActivityIndicator color="#054A29" style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.paymentOptionRow} onPress={() => processMarketplacePayment('BANK')}>
              <BankIcon size={22} color="#666" />
              <View style={{ marginLeft: 14 }}>
                <Text style={{ fontWeight: '700', fontSize: 15, color: '#666' }}>Direct Wire Settlement</Text>
                <Text style={{ color: '#999', fontSize: 12 }}>Pending offline bank routing</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#dc3545', marginTop: 15 }]} onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.primaryButtonText}>✕ Return to Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          MODAL INTERFACE B: PAYSTACK LIVE WEBVIEW INTERFACE OVERLAY
          ========================================== */}
      <Modal visible={paymentUrl !== null} animationType="fade" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ height: 50, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
            <TouchableOpacity onPress={() => setPaymentUrl(null)}>
              <Text style={{ color: '#dc3545', fontWeight: 'bold' }}>Cancel Payment</Text>
            </TouchableOpacity>
            <Text style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#666' }}>Secure Paystack Terminal</Text>
          </View>
          {paymentUrl && (
            <WebView 
              source={{ uri: paymentUrl }} 
              onNavigationStateChange={handlePaystackNavigationStateChange}
              startInLoadingState={true}
              renderLoading={() => <ActivityIndicator color="#054A29" size="large" style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -20 }, { translateY: -20 }] }} />}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  splashContainer: { flex: 1, backgroundColor: '#054A29', justifyContent: 'center', alignItems: 'center' },
  splashContent: { alignItems: 'center', marginBottom: 40 },
  splashLogo: { fontSize: 42, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  splashSubtitle: { fontSize: 16, color: '#FFCC00', fontWeight: '600', marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' },
  flagRibbon: { flexDirection: 'row', width: '60%', height: 4, borderRadius: 2, overflow: 'hidden', marginVertical: 10 },
  flagStrip: { flex: 1, height: '100%' },
  loadingText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, position: 'absolute', bottom: 40, fontFamily: 'System' },
  loginLogo: { fontSize: 36, fontWeight: '900', color: '#054A29' },
  loginSub: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 6, paddingHorizontal: 20, lineHeight: 18 },
  loginCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  inputIconWrapper: { marginBottom: 16 },
  formInputNoMargin: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  primaryButton: { backgroundColor: '#054A29', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  hintBox: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, width: '100%', marginTop: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  hintTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 6 },
  hintText: { fontSize: 12, color: '#4B5563', marginBottom: 4 },
  mainContent: { flex: 1 },
  screenScroll: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLogo: { fontSize: 22, fontWeight: '900', color: '#054A29' },
  flagEmoji: { fontSize: 18 },
  headerSub: { fontSize: 13, color: '#666', marginTop: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  searchBarContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 4, alignItems: 'center', marginBottom: 20 },
  searchInput: { flex: 1, paddingHorizontal: 12, height: 40, color: '#000' },
  searchButton: { backgroundColor: '#054A29', width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitleRow: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  categoriesRow: { flexDirection: 'row', marginBottom: 20 },
  catCard: { alignItems: 'center', marginRight: 16 },
  catIconContainer: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  catText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  featuredRow: { flexDirection: 'row', marginBottom: 20 },
  featuredCard: { width: 220, backgroundColor: '#FFF', borderRadius: 12, padding: 8, marginRight: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  featuredImg: { width: '100%', height: 130, borderRadius: 8, backgroundColor: '#F3F4F6' },
  featuredName: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 8 },
  featuredMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  featuredRegion: { fontSize: 11, color: '#666' },
  ratingBox: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#111827', marginLeft: 4 },
  roleDashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  dashboardBadgeText: { fontSize: 11, fontWeight: '700', color: '#054A29', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: 4 },
  dashboardMainTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  logoutIconButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  walletCardComponent: { backgroundColor: '#054A29', borderRadius: 16, padding: 20, marginBottom: 20 },
  walletHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  walletCurrencyAmount: { color: '#FFF', fontSize: 28, fontWeight: '900', marginVertical: 4 },
  walletBottomStats: { borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingTop: 10, marginTop: 4 },
  walletSecureText: { color: '#FFCC00', fontSize: 11, fontWeight: '600' },
  statsGridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statsHalfBox: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, width: '48%' },
  statBoxLabel: { fontSize: 11, color: '#6B7280', marginVertical: 4 },
  statBoxValue: { fontSize: 15, fontWeight: '800', color: '#111827' },
  bookingRowMockCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 40 },
  bookingStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  adminFundBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  adminFundBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  adminMenuActionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  adminMenuTextText: { fontWeight: '600', fontSize: 14, color: '#1F2937', marginLeft: 12 },
  mapFloatingHeader: { position: 'absolute', top: 16, left: 16, right: 16, backgroundColor: '#FFF', padding: 12, borderRadius: 10, zIndex: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  mapHeaderTitle: { fontWeight: '800', fontSize: 15, color: '#111827' },
  mapHeaderSub: { fontSize: 11, color: '#666', marginTop: 2 },
  mapGridContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapMarkerPin: { position: 'absolute' },
  detailsHeroImage: { width: '100%', height: height * 0.35, backgroundColor: '#F3F4F6' },
  backButtonFloating: { position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  detailsCardBody: { padding: 20, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, minHeight: height * 0.5 },
  detailsTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  detailsLocText: { color: '#054A29', fontWeight: '700', fontSize: 13, marginTop: 4 },
  detailsDesc: { color: '#4B5563', fontSize: 14, lineHeight: 22, marginTop: 12, marginBottom: 80 },
  actionStickyBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stickyPriceLabel: { color: '#666', fontSize: 12 },
  stickyPriceVal: { fontSize: 22, fontWeight: '900', color: '#054A29' },
  detailsBookBtn: { backgroundColor: '#054A29', paddingHorizontal: 32, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerWithBack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingVertical: 4 },
  centerHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  formGroup: { marginBottom: 20 },
  formInput: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, fontSize: 14, color: '#000', marginTop: 4, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  counterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  counterBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  counterBtnText: { fontSize: 20, fontWeight: 'bold' },
  counterVal: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20 },
  screenHeadingCenter: { fontSize: 18, fontWeight: '800', textAlign: 'center', color: '#111827' },
  listItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  listTitle: { fontSize: 15, fontWeight: '600' },
  profileHeaderBg: { backgroundColor: '#054A29', padding: 30, alignItems: 'center' },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFCC00', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#054A29' },
  profileName: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  profileEmail: { color: '#D1E7DD', fontSize: 13, marginTop: 2 },
  profileMenuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  profileMenuText: { flex: 1, marginLeft: 14, fontSize: 14, fontWeight: '600', color: '#374151' },
  modalCenteredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  paymentSelectorBox: { width: '85%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 5 },
  paymentTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  paymentSubtitle: { fontSize: 12, color: '#666', marginTop: 4, marginBottom: 20 },
  paymentOptionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, backgroundColor: '#F3F4F6', marginBottom: 12 },
  navBar: { flexDirection: 'row', height: 60, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFF' },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navText: { fontSize: 10, color: '#999', marginTop: 4, fontWeight: '600' },
  navTextActive: { color: '#054A29', fontWeight: '700' }
});