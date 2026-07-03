import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import CookieConsent from "@/components/cookie-consent";
import { 
  Search, 
  Gift,
  MapPin, 
  Clock, 
  Tag,
  IndianRupee, 
  Star,
  Shield,
  Truck,
  Clock4,
  Heart,
  ChevronDown,
  Filter,
  Navigation,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  User,
  LogIn,
  ChefHat,
  Crown,
  BookOpen,
  Menu,
  X,
  Download,
  Users,
  ExternalLink,
  Zap,
  Code,
  Cpu,
  Sparkles,
  Award,
  GitBranch,
  Globe,
  Upload,
  Image,
  Utensils,
  Pizza,
  Coffee,
  IceCream
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { TiffinWithSeller } from "@shared/schema";

interface TopRatedSeller {
  _id: string;
  shopName: string;
  city: string;
  ratingStats?: {
    averageRating: number;
    totalRatings: number;
  };
  user?: {
    name: string;
    email: string;
  };
}

// Import optimized images
import heroImage from "@assets/generated_images/Traditional_Indian_tiffin_thali_d174217b.png";
import vegImage from "@assets/generated_images/Vegetarian_tiffin_lunch_box_a5780b62.png";
import nonVegImage from "@assets/generated_images/Non-vegetarian_tiffin_meal_aa63199b.png";

const categoryImages: Record<string, string> = {
  Veg: vegImage,
  "Non-Veg": nonVegImage,
};

// Featured cities
const featuredCities = ["Lucknow", "Unnao", "Nawabganj", "Kanpur"];

// Food categories with icons
const foodCategories = [
  { name: "Biryani", icon: "🍛", emoji: "🍛" },
  { name: "Burger", icon: "🍔", emoji: "🍔" },
  { name: "Tiffin", icon: "🍱", emoji: "🍱" },
  { name: "Corn", icon: "🌽", emoji: "🌽" },
  { name: "Rice", icon: "🍚", emoji: "🍚" },
  { name: "Noodles", icon: "🍜", emoji: "🍜" },
  { name: "Chicken", icon: "🍗", emoji: "🍗" },
  { name: "Paneer", icon: "🧀", emoji: "🧀" },
  { name: "Mushroom", icon: "🍄", emoji: "🍄" },
  { name: "Aloo", icon: "🥔", emoji: "🥔" },
  { name: "Pizza", icon: "🍕", emoji: "🍕" },
  { name: "Desserts", icon: "🍨", emoji: "🍨" }
];

// Scroll animation component with 3D effect - Mobile Optimized
const ScrollAnimation3D = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 transform ${
        isVisible
          ? "translate-y-0 opacity-100 rotate-0 scale-100"
          : "translate-y-8 opacity-0 rotate-1 scale-95"
      } ${className}`}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  );
};

// Image Upload Component
const ImageUpload = ({ onImageUpload }: { onImageUpload: (url: string) => void }) => {
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      setIsUploading(true);
      // Simulate upload process
      setTimeout(() => {
        onImageUpload(imageUrl);
        setIsUploading(false);
      }, 1000);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
      <div className="flex items-center gap-3 mb-4">
        <Image className="w-6 h-6 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-800">Upload Image</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste the URL of your image (JPG, PNG, WebP supported)
          </p>
        </div>

        <Button
          onClick={handleUrlSubmit}
          disabled={!imageUrl.trim() || isUploading}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Main Home Component
export default function Home() {
  const { data: topRatedSellers = [] } = useQuery<TopRatedSeller[]>({
    queryKey: ["/api/top-rated-sellers"],
  });
  
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedFoodType, setSelectedFoodType] = useState<string | null>(null);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string | null>(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [userType, setUserType] = useState<"customer" | "seller" | "admin" | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [location] = useLocation();
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState("https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80");
  const [bannerImageUrl, setBannerImageUrl] = useState("https://image2url.com/images/1763986721956-7bc4c565-ef21-4771-9eaa-0dd94be72037.jpeg");
  const [showSearchInput, setShowSearchInput] = useState(false);

  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Home component ke state variables mein add karo:
const [userLocation, setUserLocation] = useState({
  city: "Lucknow", // Default city
  address: "Sector J, Jankipuram"
});

// User data fetch karne ke liye useEffect add karo
useEffect(() => {
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.city && userData.address) {
            setUserLocation({
              city: userData.city,
              address: userData.address
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  fetchUserData();
}, []);

  const searchTerms = [
    "kadhai paneer..",
    "butter chicken..", 
    "biryani..",
    "tiffin services..",
    "home cooked meals..",
    "daily lunch..",
    "healthy food..",
    "veg thali..",
    "chole bhature..",
    "north indian food..",
    "south indian food..",
    "paneer butter masala..",
    "dal makhani..",
    "rajma chawal.."
  ];

  useEffect(() => {
    const currentTerm = searchTerms[placeholderIndex];
    const baseText = "Search for ";
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentTerm.length) {
          setCurrentPlaceholder(baseText + currentTerm.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        if (charIndex > 0) {
          setCurrentPlaceholder(baseText + currentTerm.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setPlaceholderIndex((placeholderIndex + 1) % searchTerms.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, placeholderIndex]);

  const { data: tiffins = [], isLoading } = useQuery<TiffinWithSeller[]>({
    queryKey: ["/api/tiffins"],
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);

      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset;
      const trackLength = docHeight - winHeight;
      const progress = Math.floor((scrollTop / trackLength) * 100);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (userType === "seller") {
      window.location.href = "/seller/dashboard";
    } else if (userType === "admin") {
      window.location.href = "/admin";
    } else if (userType === "customer") {
      window.location.href = "/my-bookings";
    }
  }, [userType]);

  const cities = Array.from(new Set(tiffins.map((t) => t.seller.city)));
  const categories = ["Veg", "Non-Veg"];
  const foodTypes = ["Tiffin"];

  // Price ranges define karo
  const priceRanges = [
    { label: "Under ₹100", value: "0-100", min: 0, max: 100 },
    { label: "₹100 - ₹200", value: "100-200", min: 100, max: 200 },
    { label: "₹200 - ₹300", value: "200-300", min: 200, max: 300 },
    { label: "₹300 - ₹400", value: "300-400", min: 300, max: 400 },
    { label: "₹400 - ₹500", value: "400-500", min: 400, max: 500 },
    { label: "Above ₹500", value: "500+", min: 500, max: Infinity }
  ];

  // Filtered tiffins mein price range filter add karo
  const filteredTiffins = tiffins.filter((tiffin) => {
    const matchesSearch =
      !searchQuery ||
      tiffin.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tiffin.seller.shopName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || tiffin.category === selectedCategory;
    const matchesCity = !selectedCity || tiffin.seller.city === selectedCity;
    
    const matchesFoodType = !selectedFoodType || 
      (selectedFoodType === "Tiffin" && tiffin.serviceType === "tiffin") ||
      (selectedFoodType === "Meal" && tiffin.serviceType === "meal");

    // Food category filter
    const matchesFoodCategory = !selectedFoodCategory || 
      tiffin.title.toLowerCase().includes(selectedFoodCategory.toLowerCase()) ||
      tiffin.description.toLowerCase().includes(selectedFoodCategory.toLowerCase());

    // Price range filter
    const matchesPrice = !selectedPriceRange || (() => {
      const range = priceRanges.find(r => r.value === selectedPriceRange);
      if (!range) return true;
      
      if (range.value === "500+") {
        return tiffin.price >= range.min;
      }
      return tiffin.price >= range.min && tiffin.price <= range.max;
    })();
    
    return matchesSearch && matchesCategory && matchesCity && matchesFoodType && matchesFoodCategory && matchesPrice;
  });

  const popularTiffins = filteredTiffins.slice(0, 6);

  const handleLogin = (type: "customer" | "seller" | "admin") => {
    setUserType(type);
    setShowLoginPopup(false);
  };

  const handleImageUpload = (url: string, type: 'hero' | 'banner') => {
    if (type === 'hero') {
      setHeroImageUrl(url);
    } else {
      setBannerImageUrl(url);
    }
    setShowImageUpload(false);
  };

  const handleFoodCategoryClick = (categoryName: string) => {
    setSelectedFoodCategory(selectedFoodCategory === categoryName ? null : categoryName);
    setSearchQuery(categoryName);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Cookie Consent */}
      <CookieConsent />

      {/* Navbar - White Background */}
<div className={`absolute top-0 left-0 right-0 z-40 transition-all duration-300 bg-white shadow-lg py-2`}>
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center justify-between">
      {/* Left side - Small Logo aur Location with dropdown */}
      <div className="flex items-center gap-3">
        {/* Small Logo - Corner mein */}
        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        
        {/* Location Display with Dropdown */}
        <div className="flex flex-col relative group">
          <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-gray-800">{userLocation.city}</span>
            <ChevronDown className="w-3 h-3 text-gray-500 ml-1" />
          </div>
          
          {/* Dropdown for full address */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-gray-800">Your Location</span>
              </div>
              <p className="text-sm text-gray-600">{userLocation.address}</p>
              <p className="text-xs text-gray-500 mt-1">{userLocation.city}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-6">
        {/* Search Button */}
        <Button 
          variant="ghost"
          onClick={() => setShowSearchInput(!showSearchInput)}
          className="flex items-center gap-2 text-gray-700 hover:text-red-500"
        >
          <Search className="w-5 h-5" />
          Search
        </Button>

        <Link href="/my-bookings">
          <span className={`font-medium cursor-pointer transition-colors text-gray-700 hover:text-red-500`}>
            My Orders
          </span>
        </Link>
        
        {userType === "customer" && (
          <Link href="/my-bookings">
            <span className={`font-medium cursor-pointer transition-colors text-gray-700 hover:text-red-500`}>
              <BookOpen className="w-4 h-4 inline mr-1" />
              My Bookings
            </span>
          </Link>
        )}

        <div className="flex items-center gap-4">
          <Link href="/help">
            <span className={`font-medium cursor-pointer transition-colors text-gray-700 hover:text-red-500`}>
              Help
            </span>
          </Link>
          
          <Button 
            onClick={() => setShowLoginPopup(true)}
            className={`rounded-full font-medium transition-all bg-red-500 hover:bg-red-600 text-white border border-red-500`}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:hidden">

        
        {/* Mobile Search Button */}
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setShowSearchInput(!showSearchInput)}
          className="text-gray-700"
        >
          <Search className="w-5 h-5" />
        </Button>
        
        <Button 
          onClick={() => setShowLoginPopup(true)}
          className={`rounded-full font-medium transition-all bg-red-500 hover:bg-red-600 text-white border border-red-500`}
          size="sm"
        >
          <LogIn className="w-4 h-4" />
        </Button>
        
       
      </div>
    </div>

    {/* Search Input - Shows when search button is clicked */}
    {(showSearchInput || window.innerWidth < 1024) && (
      <div className="mt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
          <Input
            placeholder={currentPlaceholder}
            className="pl-10 pr-4 py-2 text-base border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    )}   
  </div>
</div>

      {/* Add padding to account for fixed navbar */}
      <div className="pt-20"></div>

     {/* Image Upload Modal */}
{showImageUpload && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="relative">
      <ImageUpload onImageUpload={(url) => handleImageUpload(url, 'banner')} />
      <Button
        variant="ghost"
        size="icon"
        className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg"
        onClick={() => setShowImageUpload(false)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  </div>
)}

{/* Hero Section */}
<section className="relative bg-white">
  <div className="max-w-7xl mx-auto">
    {/* Banner Image - Only image visible */}
    <div className="relative group"><br></br>
      <img
        src={bannerImageUrl}
        alt="Food Banner"
        className="w-full h-auto object-cover"
        onError={(e) => {
          e.currentTarget.src = "https://image2url.com/images/1763986721956-7bc4c565-ef21-4771-9eaa-0dd94be72037.jpeg";
        }}
      />
    </div>

{/* Food Categories - Small Circle Design */}
<div className="mt-3">
  <h2 className="text-xl font-bold text-gray-800 text-center mb-4">What's on your mind?</h2>
  <div className="relative">
    {/* Scrollable Container - Circle Buttons */}
    <div className="flex overflow-x-auto hide-scrollbar gap-4 px-1 pb-3">
      {foodCategories.map((category, index) => (
        <button
          key={category.name}
          onClick={() => handleFoodCategoryClick(category.name)}
          className={`flex-shrink-0 flex flex-col items-center p-3 transition-all duration-300 hover:scale-110 ${
            selectedFoodCategory === category.name 
              ? 'bg-red-500 shadow-lg shadow-red-200' 
              : 'bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50'
          } rounded-full min-w-[70px] min-h-[70px]`}
        >
          <span className={`text-xl mb-1 ${
            selectedFoodCategory === category.name ? 'text-white' : 'text-gray-700'
          }`}>
            {category.emoji}
          </span>
          <span className={`text-[10px] font-medium text-center leading-tight ${
            selectedFoodCategory === category.name ? 'text-white font-bold' : 'text-gray-700'
          }`}>
            {category.name}
          </span>
        </button>
      ))}
    </div>
    
    {/* Simple arrow indicator - Moved Up */}
    <div className="absolute right-2 top-[40%] transform -translate-y-1/2 pointer-events-none">
      <div className="w-3 h-3 border-r-2 border-b-2 border-gray-400 rotate-[-45deg]"></div>
    </div>
    
    {/* Scroll hint - subtle gradient on right side */}
    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
  </div>
</div>
  </div>
</section>

     {/* Tiffins and Meals Section - Directly after hero */}
<section className="py-6 bg-white -mt-4">  {/* py-12 se py-6 aur -mt-4 add */}
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-3">  {/* mb-8 se mb-6, gap-4 se gap-3 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">  {/* text-3xl se text-2xl, mb-2 se mb-1 */}
          {selectedFoodCategory 
            ? `Best ${selectedFoodCategory} Items`
            : selectedFoodType === "Tiffin" 
            ? "Best Tiffin Boxes" 
            : selectedFoodType === "Meal" 
            ? "Best Full Meals"
            : "Best Food Near You"
          }
        </h2>
        <p className="text-gray-600 text-sm">  {/* text-sm add */}
          Fresh homemade food from local kitchens
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-1">  {/* gap-2 se gap-1 */}
        <div className="flex gap-1">  {/* gap-2 se gap-1 */}
          {foodTypes.map((type) => (
            <Button
              key={type}
              onClick={() => setSelectedFoodType(selectedFoodType === type ? null : type)}
              variant={selectedFoodType === type ? "default" : "outline"}
              size="sm"
              className={`rounded-full text-xs ${
                selectedFoodType === type
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              {type}
            </Button>
          ))}
        </div>

              <div className="flex gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    className={`rounded-full ${
                      selectedCategory === category
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* More Filters Button with Dropdown */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 rounded-full whitespace-nowrap" 
                  size="sm"
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                  {selectedPriceRange && (
                    <span className="ml-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Button>

                {/* Filters Dropdown */}
                {showMoreFilters && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Filters</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMoreFilters(false)}
                        className="w-6 h-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Price Range Filter */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-3">Price Range</h4>
                      <div className="space-y-2">
                        {priceRanges.map((range) => (
                          <div
                            key={range.value}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              selectedPriceRange === range.value
                                ? 'bg-red-50 border border-red-200'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={() => {
                              setSelectedPriceRange(selectedPriceRange === range.value ? null : range.value);
                            }}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedPriceRange === range.value
                                ? 'border-red-500 bg-red-500'
                                : 'border-gray-400'
                            }`}>
                              {selectedPriceRange === range.value && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className={`text-sm ${
                              selectedPriceRange === range.value ? 'text-red-600 font-semibold' : 'text-gray-700'
                            }`}>
                              {range.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clear All Button */}
                    {(selectedPriceRange) && (
                      <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        size="sm"
                        onClick={() => {
                          setSelectedPriceRange(null);
                        }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="bg-gray-100 p-1 rounded-xl inline-flex overflow-x-auto w-full">
              {[
                { value: "all", label: "All Items" },
                { value: "popular", label: "Popular 🔥" },
                { value: "top-rated", label: "Top Rated ⭐" },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-500 data-[state=active]:shadow-sm font-semibold px-4 py-2 transition-all hover:scale-105 whitespace-nowrap"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* All Items Tab */}
            <TabsContent value="all" className="mt-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden border-0 shadow-lg rounded-2xl">
                      <Skeleton className="h-48 w-full rounded-2xl" />
                      <div className="p-6 space-y-4">
                        <Skeleton className="h-6 w-3/4 rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-2/3 rounded" />
                        <div className="flex justify-between items-center pt-4">
                          <Skeleton className="h-8 w-20 rounded-lg" />
                          <Skeleton className="h-10 w-24 rounded-lg" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredTiffins.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No items found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
                  <Button 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory(null);
                      setSelectedCity(null);
                      setSelectedFoodType(null);
                      setSelectedFoodCategory(null);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full hover:scale-105 transition-transform"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTiffins.map((tiffin, index) => (
                      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group rounded-2xl transform hover:-translate-y-2 hover:scale-105">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={categoryImages[tiffin.category]}
                            alt={tiffin.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          
                          <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                            {tiffin.serviceType === "tiffin" ? "🍱 Tiffin" : "🍛 Meal"}
                          </div>

                          {index % 3 === 0 && (
                            <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                              ⭐ Premium
                            </div>
                          )}

                          <div className="absolute bottom-3 left-3">
                            <Badge className={`${
                              tiffin.category === "Veg" 
                                ? "bg-green-500 text-white" 
                                : tiffin.category === "Non-Veg"
                                ? "bg-red-500 text-white"
                                : "bg-purple-500 text-white"
                            } border-0 font-semibold shadow-lg`}>
                              {tiffin.category}
                            </Badge>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
                          >
                            <Heart className="w-5 h-5 text-gray-600" />
                          </Button>
                        </div>

                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-bold text-gray-800 line-clamp-1 group-hover:text-red-500 transition-colors">
                              {tiffin.title}
                            </h3>
                            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-semibold">
                              <Star className="w-3 h-3 fill-green-500 text-green-500" />
                              <span>{(4.4 + ((tiffin._id.charCodeAt(0) + tiffin._id.charCodeAt(tiffin._id.length - 1)) % 6 * 0.1)).toFixed(1)}</span>
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                            {tiffin.description}
                          </p>

                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-xs font-bold">T</span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800 text-sm">
                                {tiffin.seller.shopName}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" />
                                {tiffin.seller.city} • 2.5 km
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-lg font-bold text-gray-800">
                                <IndianRupee className="w-4 h-4" />
                                <span>{tiffin.price}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-500 line-through">
                                  <IndianRupee className="w-3 h-3 inline" />
                                  {Math.round(tiffin.price * 1.2)}
                                </span>
                                <span className="text-xs text-green-600 font-semibold">
                                  You save ₹{Math.round(tiffin.price * 0.2)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <Truck className="w-3 h-3" />
                                FREE
                              </div>
                              <Link href={`/tiffin/${tiffin._id}`}>
                                <Button className="bg-red-500 hover:bg-red-600 text-white px-4 rounded-full font-semibold shadow-lg shadow-red-200 hover:scale-105 transition-transform">
                                  Order Now
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Popular Tab */}
            <TabsContent value="popular" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularTiffins.map((tiffin, index) => (
                
                    <Card className="overflow-hidden border-0 shadow-lg rounded-2xl group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={categoryImages[tiffin.category]}
                          alt={tiffin.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                          {tiffin.serviceType === "tiffin" ? "🍱 Tiffin" : "🍛 Meal"}
                        </div>
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                          Popular 🔥
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{tiffin.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tiffin.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-lg font-bold text-gray-800">
                              <IndianRupee className="w-4 h-4" />
                              <span>{tiffin.price}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              <Star className="w-3 h-3 fill-green-500 text-green-500" />
                              4.5
                            </div>
                          </div>
                          <Link href={`/tiffin/${tiffin._id}`}>
                            <Button className="bg-red-500 hover:bg-red-600 text-white rounded-full hover:scale-105 transition-transform">
                              Order Now
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                ))}
              </div>
            </TabsContent>

            {/* Top Rated Tab */}
            <TabsContent value="top-rated" className="mt-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden border-0 shadow-lg rounded-2xl">
                      <Skeleton className="h-48 w-full rounded-2xl" />
                      <div className="p-6 space-y-4">
                        <Skeleton className="h-6 w-3/4 rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-2/3 rounded" />
                        <div className="flex justify-between items-center pt-4">
                          <Skeleton className="h-8 w-20 rounded-lg" />
                          <Skeleton className="h-10 w-24 rounded-lg" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (() => {
                const topRatedSellerIds = topRatedSellers.map(seller => seller._id);
                const topRatedShopNames = topRatedSellers.map(seller => seller.shopName.toLowerCase());
                
                const topRatedTiffins = filteredTiffins.filter(tiffin => {
                  const isFromTopRatedSeller = topRatedSellerIds.includes(tiffin.seller._id);
                  const isFromTopRatedShop = topRatedShopNames.includes(tiffin.seller.shopName.toLowerCase());
                  
                  return isFromTopRatedSeller || isFromTopRatedShop;
                });

                return topRatedTiffins.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No top rated items found</h3>
                    <p className="text-gray-600 mb-4">
                      {topRatedSellers.length > 0 
                        ? "Top rated sellers found, but no matching tiffins with current filters"
                        : "No top rated sellers available yet"
                      }
                    </p>
                    
                    <Button 
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory(null);
                        setSelectedCity(null);
                        setSelectedFoodType(null);
                        setSelectedFoodCategory(null);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full hover:scale-105 transition-transform"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topRatedTiffins.map((tiffin, index) => (
                  
                        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group rounded-2xl transform hover:-translate-y-2 hover:scale-105 border-2 border-yellow-200">
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={categoryImages[tiffin.category]}
                              alt={tiffin.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            
                            {/* Top Rated Badge */}
                            <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" />
                              Top Rated
                            </div>

                            <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                              {tiffin.serviceType === "tiffin" ? "🍱 Tiffin" : "🍛 Meal"}
                            </div>

                            <div className="absolute bottom-3 left-3">
                              <Badge className={`${
                                tiffin.category === "Veg" 
                                  ? "bg-green-500 text-white" 
                                  : tiffin.category === "Non-Veg"
                                  ? "bg-red-500 text-white"
                                  : "bg-purple-500 text-white"
                              } border-0 font-semibold shadow-lg`}>
                                {tiffin.category}
                              </Badge>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-3 right-12 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
                            >
                              <Heart className="w-5 h-5 text-gray-600" />
                            </Button>
                          </div>

                          <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-xl font-bold text-gray-800 line-clamp-1 group-hover:text-red-500 transition-colors">
                                {tiffin.title}
                              </h3>
                              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-semibold">
                                <Star className="w-3 h-3 fill-green-500 text-green-500" />
                                <span>{(4.4 + ((tiffin._id.charCodeAt(0) + tiffin._id.charCodeAt(tiffin._id.length - 1)) % 6 * 0.1)).toFixed(1)}</span>
                              </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                              {tiffin.description}
                            </p>

                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white text-xs font-bold">
                                  {tiffin.seller.shopName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                  {tiffin.seller.shopName}
                                  <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
                                    Top Seller
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <MapPin className="w-3 h-3" />
                                  {tiffin.seller.city} • 2.5 km
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-lg font-bold text-gray-800">
                                  <IndianRupee className="w-4 h-4" />
                                  <span>{tiffin.price}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm text-gray-500 line-through">
                                    <IndianRupee className="w-3 h-3 inline" />
                                    {Math.round(tiffin.price * 1.2)}
                                  </span>
                                  <span className="text-xs text-green-600 font-semibold">
                                    You save ₹{Math.round(tiffin.price * 0.2)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                  <Truck className="w-3 h-3" />
                                  FREE
                                </div>
                                <Link href={`/tiffin/${tiffin._id}`}>
                                  <Button className="bg-red-500 hover:bg-red-600 text-white px-4 rounded-full font-semibold shadow-lg shadow-red-200 hover:scale-105 transition-transform">
                                    Order Now
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Card>
    
                    ))}
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {showLoginPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Tiffo</h2>
              <p className="text-gray-600">Choose how you want to continue</p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => handleLogin("customer")}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-base font-semibold transition-all hover:scale-105"
              >
                <User className="w-5 h-5 mr-3" />
                Continue as Customer
              </Button>

              <Button 
                onClick={() => handleLogin("seller")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl text-base font-semibold transition-all hover:scale-105"
              >
                <ChefHat className="w-5 h-5 mr-3" />
                Continue as Seller
              </Button>
            </div>

            <Button 
              onClick={() => setShowLoginPopup(false)}
              variant="ghost" 
              className="w-full mt-4 text-gray-500 hover:text-gray-700"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {isScrolled && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110"
          size="icon"
        >
          <Navigation className="w-5 h-5" />
        </Button>
      )}

      {/* Sticky Bottom Navigation Bar */}
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 lg:hidden">
  <div className="flex justify-around items-center py-3">
    
    {/* Home Button */}
    <Link href="/" className="flex flex-col items-center">
      <div className={`w-6 h-6 flex items-center justify-center ${
        location === '/' ? 'text-red-500' : 'text-gray-600'
      }`}>
        🏠
      </div>
      <span className={`text-xs mt-1 ${
        location === '/' ? 'text-red-500 font-bold' : 'text-gray-600'
      }`}>
        Home
      </span>
    </Link>

    {/* Orders Button */}
    <Link href="/my-bookings" className="flex flex-col items-center">
      <div className={`w-6 h-6 flex items-center justify-center ${
        location === '/my-bookings' ? 'text-red-500' : 'text-gray-600'
      }`}>
        📦
      </div>
      <span className={`text-xs mt-1 ${
        location === '/my-bookings' ? 'text-red-500 font-bold' : 'text-gray-600'
      }`}>
        Orders
      </span>
    </Link>

    {/* APK Button */}
    <button 
      onClick={() => window.open('https://drive.google.com/drive/folders/1Jasyg4kz-8OlaIr2u-f_Hn0qwrAL82AC', '_blank')}
      className="flex flex-col items-center"
    >
      <div className="w-6 h-6 flex items-center justify-center text-gray-600">
        📱
      </div>
      <span className="text-xs mt-1 text-gray-600">
        APP
      </span>
    </button>

    {/* Offers Button */}
    <Link href="/offers" className="flex flex-col items-center">
      <div className={`w-6 h-6 flex items-center justify-center ${
        location === '/offers' ? 'text-red-500' : 'text-gray-600'
      }`}>
        🎁
      </div>
      <span className={`text-xs mt-1 ${
        location === '/offers' ? 'text-red-500 font-bold' : 'text-gray-600'
      }`}>
        Offers
      </span>
    </Link>

    {/* Help Button */}
    <Link href="/help" className="flex flex-col items-center">
      <div className={`w-6 h-6 flex items-center justify-center ${
        location === '/help' ? 'text-red-500' : 'text-gray-600'
      }`}>
        ❓
      </div>
      <span className={`text-xs mt-1 ${
        location === '/help' ? 'text-red-500 font-bold' : 'text-gray-600'
      }`}>
        Help
      </span>
    </Link>

  </div>
</div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="font-bold text-xl">Tiffo</span>
              </div>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                Delivering homemade happiness to your doorstep. Fresh, hygienic, and delicious tiffins from trusted kitchens.
              </p>
              <div className="flex gap-3">
                <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors hover:scale-110" />
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors hover:scale-110" />
                <a
                  href="https://www.instagram.com/tiffo.official"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors hover:scale-110" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform"><a href="/about">About Us</a></li>
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform"><a href="/register">Partner With Us</a></li>
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform">
                  <a 
                    href="https://wa.me/918115067311" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform">
                  <Link href="/terms-conditions">Terms & Conditions</Link>
                </li>
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform">
                  <Link href="/privacy-policy">Privacy Policy</Link>
                </li>
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform">
                  <a href="/cookie-policy">Cookie Policy</a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Contact Us</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <a href="tel:+918115067311" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>+91 8115067311</span>
                </a>
                <a href="tel:+918115067311" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>+91 9670421522</span>
                </a>
                <div className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>help@tiffo.com</span>
                </div>
                <div className="flex items-center gap-2 hover:text-white transition-colors">
                  <MapPin className="w-4 h-4" />
                  <span>Lucknow(Uttar Pradesh), India</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Tiffo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}














