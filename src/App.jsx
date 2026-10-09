import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Pizza, Users, Bell, CheckCircle2, Clock, 
  ChefHat, MoreVertical, Plus, X, Phone, MessageCircle, 
  MapPin, Timer, Gift, Menu, Star, MessageSquare, Ticket, Edit2, Trash2, BarChart2, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from './firebase/firebase.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, serverTimestamp, query, orderBy, where, Timestamp } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import localPrizes from './data/prizes.js';
import Receipt from './components/Receipt';
// Menu Inventory from Zukas Kitchen
const MENU_ITEMS = [
  { id: 'm-s', name: 'Pizza Margherita (Small)', price: 99 },
  { id: 'm-m', name: 'Pizza Margherita (Medium)', price: 139 },
  { id: 'cc-s', name: 'Pizza Cheese Corn (Small)', price: 119 },
  { id: 'cc-m', name: 'Pizza Cheese Corn (Medium)', price: 149 },
  { id: 'vp-s', name: 'Pizza Veg Pizza (Small)', price: 139 },
  { id: 'vp-m', name: 'Pizza Veg Pizza (Medium)', price: 179 },
  { id: 'vcc-s', name: 'Pizza Veg Cheese Corn (Small)', price: 149 },
  { id: 'vcc-m', name: 'Pizza Veg Cheese Corn (Medium)', price: 189 },
  { id: 'pt-s', name: 'Pizza Paneer Tikka (Small)', price: 159 },
  { id: 'pt-m', name: 'Pizza Paneer Tikka (Medium)', price: 199 },
  { id: 'ct-s', name: 'Pizza Chicken Tikka (Small)', price: 169 },
  { id: 'ct-m', name: 'Pizza Chicken Tikka (Medium)', price: 209 },
  { id: 'ec', name: 'Extra Cheese (Add-on)', price: 25 },
  { id: 'gb', name: 'Garlic Breadstix', price: 89 },
  { id: 'coke', name: 'Coke (500ml)', price: 40 },
];


const INITIAL_ORDERS = [
  {
    id: 'ORD-001',
    customerName: 'Aisha K.', phone: '+91 98765 43210', village: 'Khankah', source: 'whatsapp',
    offerId: 'none', offerName: '',
    items: [
      { name: 'Pizza Margherita (Medium)', qty: 1, price: 139 },
      { name: 'Garlic Breadstix', qty: 2, price: 89 }
    ],
    total: 317, status: 'new', orderTime: '10:45 AM', deliveryTime: 'ASAP (45 mins)'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [villages, setVillages] = useState([]);
  const [dailySpins, setDailySpins] = useState(0);
  const [yesterdaySales, setYesterdaySales] = useState(0);
  const [yesterdayPizzas, setYesterdayPizzas] = useState(0);
  
  const [reportDate, setReportDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [reportSpins, setReportSpins] = useState(0);
  const [reportSales, setReportSales] = useState(0);
  const [reportPizzas, setReportPizzas] = useState(0);
  const [reportExpenses, setReportExpenses] = useState(0);
  const [newVillageName, setNewVillageName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data States
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [offers, setOffers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [printOrder, setPrintOrder] = useState(null);
  
  // Order Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: '', phone: '', village: '', source: 'call', offerId: 'none',
    customOfferName: '', customOfferAmount: '', deliveryTimeMode: 'auto',
    customDeliveryTime: '', items: [{ name: '', qty: 1, price: 0 }],
    paymentMethod: 'Cash', paymentStatus: 'UNPAID'
  });

  // Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerForm, setOfferForm] = useState({ label: '', wheelLabel: '', subLabel: '', discount: 0, weight: 10 });

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, village: '', text: '' });

  // Expense State
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  // --- Fetch Data on Mount ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Reviews
        const reviewsRef = collection(db, "reviews");
        const q = query(reviewsRef, orderBy("createdAt", "desc"));
        const revSnap = await getDocs(q);
        const fetchedReviews = [];
        revSnap.forEach(doc => {
          const data = doc.data();
          let displayDate = "Just now";
          if (data.createdAt && data.createdAt.toDate) {
            displayDate = data.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }
          fetchedReviews.push({
            id: doc.id,
            customerName: data.name || "Anonymous",
            village: data.village || "",
            rating: data.rating || 5,
            text: data.text || "",
            date: displayDate
          });
        });
        setReviews(fetchedReviews);

        // Fetch Offers (Prizes)
        const prizesRef = collection(db, "prizes");
        const prizesSnap = await getDocs(prizesRef);
        const fetchedOffers = [];
        prizesSnap.forEach(doc => {
          const data = doc.data();
          const prizeId = doc.id;
          const oldToNewIds = {
            "10-percent": "10-off",
            "15-percent": "15-off",
            "25-off-combo": "25-off-2-medium-pizza"
          };
          const effectivePrizeId = oldToNewIds[prizeId] || prizeId;
          const localMatch = localPrizes.find(p => p.id === effectivePrizeId) || {};
          
          fetchedOffers.push({
            id: effectivePrizeId,
            originalId: doc.id,
            label: data.label || data.name || localMatch.label || "Discount",
            wheelLabel: data.wheelLabel || localMatch.wheelLabel || "",
            subLabel: data.subLabel || localMatch.subLabel || "",
            discount: data.value !== undefined ? data.value : (localMatch.value !== undefined ? localMatch.value : 0),
            enabled: data.enabled !== false,
            weight: typeof data.weight === "number" ? data.weight : (localMatch.weight || 10)
          });
        });

        // Merge local prizes not in Firestore
        localPrizes.forEach(localPrize => {
          if (!fetchedOffers.find(p => p.id === localPrize.id)) {
            fetchedOffers.push({
              id: localPrize.id,
              originalId: localPrize.id,
              label: localPrize.label,
              wheelLabel: localPrize.wheelLabel || "",
              subLabel: localPrize.subLabel || "",
              discount: localPrize.value || 0,
              enabled: true,
              weight: localPrize.weight || 10
            });
          }
        });

        // Sort to match wheel order
        fetchedOffers.sort((a, b) => {
          const idxA = localPrizes.findIndex(p => p.id === a.id);
          const idxB = localPrizes.findIndex(p => p.id === b.id);
          return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
        });
        
        // Fetch Today's Spins
        const today = new Date();
        today.setHours(0,0,0,0);
        try {
          const spinsRef = collection(db, "spins");
          const spinsQuery = query(spinsRef, where("createdAt", ">=", Timestamp.fromDate(today)));
          const spinsSnap = await getDocs(spinsQuery);
          setDailySpins(spinsSnap.size);
        } catch (e) {
          console.warn("Could not fetch spins:", e);
        }

        // Fetch Orders
        try {
          const ordersRef = collection(db, "orders");
          const ordersSnap = await getDocs(ordersRef);
          const fetchedOrders = [];
          
          let ySales = 0;
          let yPizzas = 0;
          
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          ordersSnap.forEach(doc => {
            const data = doc.data();
            fetchedOrders.push({ id: doc.id, ...data });
            
            // Calculate yesterday's stats
            if (data.createdAt && data.createdAt.toDate) {
              const orderDate = data.createdAt.toDate();
              if (orderDate >= yesterday && orderDate < today) {
                ySales += data.total || 0;
                if (data.items) {
                   yPizzas += data.items.reduce((sum, item) => sum + (item.qty || 0), 0);
                }
              }
            }
          });
          
          // Sort descending by orderTime or createdAt
          fetchedOrders.sort((a,b) => {
             const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
             const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
             return tB - tA;
          });
          
          setOrders(fetchedOrders);
          setYesterdaySales(ySales);
          setYesterdayPizzas(yPizzas);
        } catch (e) {
          console.warn("Could not fetch orders. Make sure rules are updated.", e);
        }
        
        // Fetch Expenses
        try {
          const expensesRef = collection(db, "expenses");
          const expensesSnap = await getDocs(expensesRef);
          const fetchedExpenses = [];
          expensesSnap.forEach(doc => {
            fetchedExpenses.push({ id: doc.id, ...doc.data() });
          });
          fetchedExpenses.sort((a,b) => {
             const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
             const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
             return tB - tA;
          });
          setExpenses(fetchedExpenses);
        } catch (e) {
          console.warn("Could not fetch expenses. Make sure rules are updated.", e);
        }

        setOffers(fetchedOffers);

        // --- ONE-TIME RESET SCRIPT ---
        // We will run this if the user clicks a hidden button or just directly.
        window.resetPrizesToDefault = async () => {
          if(!window.confirm("This will WIPE all current offers and restore the exact 7 from the wheel. Continue?")) return;
          try {
            const snap = await getDocs(collection(db, "prizes"));
            for (const d of snap.docs) {
              await deleteDoc(doc(db, "prizes", d.id));
            }
            for (const prize of localPrizes) {
               await setDoc(doc(db, "prizes", prize.id), {
                 name: prize.label,
                 label: prize.label,
                 wheelLabel: prize.wheelLabel,
                 subLabel: prize.subLabel,
                 value: prize.value || 0,
                 weight: prize.weight || 10,
                 enabled: prize.enabled !== false,
                 isWinning: prize.isWinningPrize !== false,
                 type: prize.type || "discount",
                 bgColor: prize.bgColor,
                 textColor: prize.textColor,
                 badge: prize.badge,
                 accentColor: prize.accentColor
               });
            }
            alert("Done! Please refresh the page.");
          } catch(e) {
            console.error(e);
            alert("Error resetting prizes.");
          }
        };

        // Fetch Villages
        const villagesRef = collection(db, "villages");
        const villagesSnap = await getDocs(villagesRef);
        let fetchedVillages = [];
        villagesSnap.forEach(doc => {
          fetchedVillages.push({ id: doc.id, name: doc.data().name });
        });
        
        if (fetchedVillages.length === 0) {
            const defaultVillages = [ "Khankah", "Bindwal", "Dewabindwal", "Jairajpur", "Jagmalpur", "Hari Pur", "Naseer Pur", "Gulwa Gauri", "Alauddin Patti" ];
            for (const v of defaultVillages) {
               const docRef = await addDoc(collection(db, "villages"), { name: v });
               fetchedVillages.push({ id: docRef.id, name: v });
            }
        }
        const PREFERRED_ORDER = [
          "khankah", "bindwal", "jairajpur", "jagmalpur", "hari pur", "haripur", 
          "alauddin patti", "alauddin pat", "gulwa gauri", "gulwa", "naseer pur", "naseerpur"
        ];
        
        fetchedVillages.sort((a,b) => {
          const aLower = a.name.toLowerCase();
          const bLower = b.name.toLowerCase();
          let rankA = PREFERRED_ORDER.findIndex(p => aLower.includes(p));
          let rankB = PREFERRED_ORDER.findIndex(p => bLower.includes(p));
          rankA = rankA === -1 ? 999 : rankA;
          rankB = rankB === -1 ? 999 : rankB;
          if (rankA !== rankB) return rankA - rankB;
          return a.name.localeCompare(b.name);
        });
        
        // Let's also deduplicate the dashboard state just in case
        const unique = [];
        const seen = new Set();
        fetchedVillages.forEach(v => {
          if(!seen.has(v.name.toLowerCase().trim())) {
            seen.add(v.name.toLowerCase().trim());
            unique.push(v);
          }
        });
        setVillages(unique);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // --- Dynamic Reports based on reportDate ---
  useEffect(() => {
    let rSales = 0;
    let rPizzas = 0;
    let rExpenses = 0;
    
    const targetDate = new Date(reportDate);
    targetDate.setHours(0,0,0,0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    orders.forEach(order => {
       if (order.createdAt && order.createdAt.toDate) {
          const d = order.createdAt.toDate();
          if (d >= targetDate && d < nextDate) {
             rSales += order.total || 0;
             if (order.items) {
                 rPizzas += order.items.reduce((sum, i) => sum + (i.qty||0), 0);
             }
          }
       }
    });
    
    expenses.forEach(exp => {
       if (exp.createdAt && exp.createdAt.toDate) {
          const d = exp.createdAt.toDate();
          if (d >= targetDate && d < nextDate) {
             rExpenses += exp.amount || 0;
          }
       }
    });
    
    setReportSales(rSales);
    setReportPizzas(rPizzas);
    setReportExpenses(rExpenses);
  }, [reportDate, orders, expenses]);

  useEffect(() => {
    if (printOrder) {
      setTimeout(async () => {
        try {
          const element = document.getElementById('receipt-capture-area');
          if (!element) return;
          
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#fdfaf3' });
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], `Receipt-${printOrder.id}.jpg`, { type: 'image/jpeg' });
            
            // Format WhatsApp text
            let phone = printOrder.phone || '';
            if (phone.startsWith('0')) phone = '+91' + phone.substring(1);
            if (!phone.startsWith('+')) phone = '+91' + phone;
            phone = phone.replace(/[^0-9]/g, ''); // leave only numbers
            
            const message = `Here is your bill from Zukas Kitchen! ♥`;
            
            try {
              if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: 'Zukas Kitchen Receipt',
                  text: message,
                  files: [file]
                });
              } else {
                // Fallback: Download image and open WhatsApp web
                const link = document.createElement('a');
                link.download = `Receipt-${printOrder.id}.jpg`;
                link.href = URL.createObjectURL(blob);
                link.click();
                
                if (phone && phone.length > 9) {
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                } else {
                  alert("Receipt downloaded. You can now send it to the customer manually.");
                }
              }
            } catch (shareErr) {
              console.error("Error sharing", shareErr);
            } finally {
              setPrintOrder(null);
            }
          }, 'image/jpeg', 0.9);
        } catch(e) {
           console.error("html2canvas error", e);
           setPrintOrder(null);
        }
      }, 500); // Wait for render
    }
  }, [printOrder]);

  useEffect(() => {
    const fetchReportSpins = async () => {
        const targetDate = new Date(reportDate);
        targetDate.setHours(0,0,0,0);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);
        try {
          const spinsRef = collection(db, "spins");
          const spinsQuery = query(spinsRef, 
              where("createdAt", ">=", Timestamp.fromDate(targetDate)), 
              where("createdAt", "<", Timestamp.fromDate(nextDate))
          );
          const spinsSnap = await getDocs(spinsQuery);
          setReportSpins(spinsSnap.size);
        } catch(e) {
          console.warn("Could not fetch report spins", e);
        }
    };
    fetchReportSpins();
  }, [reportDate]);

  // --- Orders Logic ---
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);
  const markAsPreparing = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: 'preparing' });
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'preparing' } : o));
    } catch(e) { console.error(e); }
  };
  const markAsReady = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: 'ready' });
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'ready' } : o));
    } catch(e) { console.error(e); }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'new': return <Bell size={14} />;
      case 'preparing': return <ChefHat size={14} />;
      case 'ready': return <CheckCircle2 size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'new': return 'New Order';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      default: return status;
    }
  };
  const handleAddVillage = async (e) => {
    e.preventDefault();
    if(!newVillageName.trim()) return;
    try {
      const docRef = await addDoc(collection(db, "villages"), { name: newVillageName.trim() });
      setVillages([...villages, { id: docRef.id, name: newVillageName.trim() }].sort((a,b) => a.name.localeCompare(b.name)));
      setNewVillageName('');
    } catch(e) {
      console.error(e);
      alert("Error adding village");
    }
  };

  const handleDeleteVillage = async (id) => {
    if(!window.confirm("Delete this village?")) return;
    try {
      await deleteDoc(doc(db, "villages", id));
      setVillages(villages.filter(v => v.id !== id));
    } catch(e) {
      console.error(e);
    }
  };

  const handleEditVillage = async (village) => {
    const newName = window.prompt("Edit Village Name:", village.name);
    if (!newName || newName.trim() === "" || newName === village.name) return;
    
    try {
      const docRef = doc(db, "villages", village.id);
      await updateDoc(docRef, { name: newName.trim() });
      setVillages(villages.map(v => v.id === village.id ? { ...v, name: newName.trim() } : v));
    } catch(e) {
      console.error("Error updating village:", e);
      alert("Failed to update village.");
    }
  };
  const handleAddOrderItem = () => setNewOrder({ ...newOrder, items: [...newOrder.items, { name: '', qty: 1, price: 0 }] });
  const handleOrderItemChange = (index, value) => {
    const selected = MENU_ITEMS.find(item => item.name === value);
    const updated = [...newOrder.items];
    updated[index].name = value;
    if (selected) updated[index].price = selected.price;
    setNewOrder({ ...newOrder, items: updated });
  };
  const handleOrderQtyChange = (index, qty) => {
    const updated = [...newOrder.items];
    updated[index].qty = qty;
    setNewOrder({ ...newOrder, items: updated });
  };
  const handleRemoveOrderItem = (index) => {
    setNewOrder({ ...newOrder, items: newOrder.items.filter((_, i) => i !== index) });
  };

  const calculateTotal = () => {
    const subtotal = newOrder.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let discount = 0;
    if (newOrder.offerId === 'custom') {
      discount = parseInt(newOrder.customOfferAmount) || 0;
    } else if (newOrder.offerId !== 'none') {
      discount = offers.find(o => o.id === newOrder.offerId)?.discount || 0;
    }
    return Math.max(0, subtotal - discount);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    const now = new Date();
    const orderTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let deliveryTimeString = newOrder.deliveryTimeMode === 'custom' && newOrder.customDeliveryTime 
      ? newOrder.customDeliveryTime 
      : new Date(now.getTime() + 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let finalOfferName = '';
    if (newOrder.offerId === 'custom' && (newOrder.customOfferName || newOrder.customOfferAmount)) {
      finalOfferName = `${newOrder.customOfferName || 'Special Discount'} (-₹${newOrder.customOfferAmount || 0})`;
    } else if (newOrder.offerId !== 'none') {
      finalOfferName = offers.find(o => o.id === newOrder.offerId)?.label || '';
    }

    const orderToAdd = {
      ...newOrder,
      id: `ORD-${(orders.length + 1).toString().padStart(3, '0')}-${Math.floor(Math.random()*1000)}`,
      total: calculateTotal(), 
      status: 'new', 
      orderTime: orderTimeString, 
      deliveryTime: deliveryTimeString, 
      offerName: finalOfferName,
      createdAt: serverTimestamp()
    };
    orderToAdd.items = orderToAdd.items.filter(i => i.name.trim() !== '');

    if (orderToAdd.items.length === 0) return alert('Please select at least one item');
    if (!orderToAdd.customerName) return alert('Please add customer name');

    try {
      await setDoc(doc(db, "orders", orderToAdd.id), orderToAdd);
      
      // Update local state by pretending serverTimestamp is now
      const localOrder = { ...orderToAdd, createdAt: { toDate: () => new Date() } };
      setOrders([localOrder, ...orders]);
      setIsOrderModalOpen(false);
      setNewOrder({ customerName: '', phone: '', village: '', source: 'call', offerId: 'none', customOfferName: '', customOfferAmount: '', deliveryTimeMode: 'auto', customDeliveryTime: '', items: [{ name: '', qty: 1, price: 0 }], paymentMethod: 'Cash', paymentStatus: 'UNPAID' });
    } catch(err) {
      console.error("Error saving order:", err);
      alert("Failed to save order to Firebase");
    }
  };

  // --- Offers Logic (Firebase connected) ---
  const handleSaveOffer = async (e) => {
    e.preventDefault();
    try {
      if (editingOffer) {
        // Update in Firebase
        const prizeRef = doc(db, "prizes", editingOffer.originalId || editingOffer.id);
        await updateDoc(prizeRef, {
          name: offerForm.label,
          label: offerForm.label,
          wheelLabel: offerForm.wheelLabel,
          subLabel: offerForm.subLabel,
          value: Number(offerForm.discount),
          weight: Number(offerForm.weight),
          updatedAt: serverTimestamp()
        });
        // Update local state
        setOffers(offers.map(o => o.id === editingOffer.id ? { ...o, ...offerForm } : o));
      } else {
        // Add to Firebase
        const prizesRef = collection(db, "prizes");
        const docRef = await addDoc(prizesRef, {
          name: offerForm.label,
          label: offerForm.label,
          wheelLabel: offerForm.wheelLabel || offerForm.label,
          subLabel: offerForm.subLabel || "",
          value: Number(offerForm.discount),
          weight: Number(offerForm.weight),
          enabled: true,
          isWinning: true,
          type: "discount",
          bgColor: "#FF9F1C",
          textColor: "#FFFFFF",
          badge: "NEW OFFER",
          updatedAt: serverTimestamp()
        });
        // Update local state
        setOffers([...offers, { id: docRef.id, ...offerForm, enabled: true }]);
      }
      setIsOfferModalOpen(false);
      setEditingOffer(null);
    } catch (error) {
      console.error("Error saving offer:", error);
      alert("Failed to save offer to database.");
    }
  };

  const handleDeleteOffer = async (offerId, originalId) => {
    if(window.confirm("Are you sure you want to delete this offer? It will be immediately removed from the spin wheel!")) {
      try {
        await deleteDoc(doc(db, "prizes", originalId || offerId));
        setOffers(offers.filter(o => o.id !== offerId));
      } catch (error) {
        console.error("Error deleting offer:", error);
        alert("Failed to delete offer.");
      }
    }
  };

  const openOfferModal = (offer = null) => {
    setEditingOffer(offer);
    setOfferForm(offer ? { 
      label: offer.label, 
      wheelLabel: offer.wheelLabel || '', 
      subLabel: offer.subLabel || '', 
      discount: offer.discount,
      weight: offer.weight !== undefined ? offer.weight : 10
    } : { label: '', wheelLabel: '', subLabel: '', discount: 0, weight: 10 });
    setIsOfferModalOpen(true);
  };

  // --- Reviews Logic (Firebase connected) ---
  const handleSaveReview = async (e) => {
    e.preventDefault();
    try {
      if (editingReview) {
        const reviewRef = doc(db, "reviews", editingReview.id);
        await updateDoc(reviewRef, {
          name: reviewForm.customerName,
          village: reviewForm.village,
          rating: reviewForm.rating,
          text: reviewForm.text
        });
        setReviews(reviews.map(r => r.id === editingReview.id ? { ...r, ...reviewForm } : r));
      } else {
        const reviewsRef = collection(db, "reviews");
        const docRef = await addDoc(reviewsRef, {
          name: reviewForm.customerName,
          village: reviewForm.village,
          rating: reviewForm.rating,
          text: reviewForm.text,
          createdAt: serverTimestamp()
        });
        setReviews([{ id: docRef.id, date: 'Just now', ...reviewForm }, ...reviews]);
      }
      setIsReviewModalOpen(false);
      setEditingReview(null);
    } catch (error) {
      console.error("Error saving review:", error);
      alert("Failed to save review to database.");
    }
  };

  const handleDeleteReview = async (id) => {
    if(window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteDoc(doc(db, "reviews", id));
        setReviews(reviews.filter(r => r.id !== id));
      } catch (error) {
        console.error("Error deleting review:", error);
        alert("Failed to delete review.");
      }
    }
  };

  const openReviewModal = (review = null) => {
    setEditingReview(review);
    setReviewForm(review ? { customerName: review.customerName, rating: review.rating, village: review.village, text: review.text } : { customerName: '', rating: 5, village: '', text: '' });
    setIsReviewModalOpen(true);
  };

  return (
    <div className="app-container">
      <Receipt order={printOrder} />
      {/* Sidebar Overlay (Mobile) */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-group">
            <div className="sidebar-logo">Z</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Zuka's Kitchen</h2>
          </div>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>
        
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
            <LayoutDashboard size={20} /><span>Dashboard</span>
          </div>
          <div className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => { setActiveTab('reviews'); setIsSidebarOpen(false); }}>
            <MessageSquare size={20} /><span>Reviews</span>
          </div>
          <div className={`nav-item ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => { setActiveTab('offers'); setIsSidebarOpen(false); }}>
            <Ticket size={20} /><span>Spinner Offers</span>
          </div>
          <div className={`nav-item ${activeTab === 'locations' ? 'active' : ''}`} onClick={() => { setActiveTab('locations'); setIsSidebarOpen(false); }}>
            <MapPin size={20} /><span>Locations (Villages)</span>
          </div>
          <div className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => { setActiveTab('expenses'); setIsSidebarOpen(false); }}>
            <BarChart2 size={20} /><span>Expenses</span>
          </div>
          <div className="nav-item" onClick={() => alert("Feature coming soon")}>
            <Users size={20} /><span>Customers</span>
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}><Menu size={20} /></button>
            <h1 className="header-title">
              {activeTab === 'dashboard' && 'Live Dashboard'}
              {activeTab === 'reviews' && 'Customer Reviews'}
              {activeTab === 'offers' && 'Spinner & Wheel Offers'}
              {activeTab === 'expenses' && 'Daily Expenses'}
            </h1>
          </div>
          <div className="header-actions">
            {activeTab === 'dashboard' && (
              <button className="btn-primary" onClick={() => setIsOrderModalOpen(true)}>
                <Plus size={18} /> <span>Add Order</span>
              </button>
            )}
            {activeTab === 'reviews' && (
              <button className="btn-primary" onClick={() => openReviewModal()}>
                <Plus size={18} /> <span>Add Review</span>
              </button>
            )}
            {activeTab === 'offers' && (
              <button className="btn-primary" onClick={() => openOfferModal()}>
                <Plus size={18} /> <span>Add Offer</span>
              </button>
            )}
          </div>
        </header>

        <div className="dashboard-body">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <motion.div className="stats-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="glass-panel stat-card">
                  <div className="stat-info">
                    <span className="stat-label">New Orders</span>
                    <span className="stat-value">{orders.filter(o => o.status === 'new').length}</span>
                  </div>
                  <div className="stat-icon orange"><Bell size={24} /></div>
                </div>
                <div className="glass-panel stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Preparing</span>
                    <span className="stat-value">{orders.filter(o => o.status === 'preparing').length}</span>
                  </div>
                  <div className="stat-icon yellow"><ChefHat size={24} /></div>
                </div>
                <div className="glass-panel stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Ready</span>
                    <span className="stat-value">{orders.filter(o => o.status === 'ready').length}</span>
                  </div>
                  <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                </div>
                <div className="glass-panel stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Today's Spins</span>
                    <span className="stat-value">{dailySpins}</span>
                  </div>
                  <div className="stat-icon purple"><Gift size={24} /></div>
                </div>
                <div className="glass-panel stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Today's Sales</span>
                    <span className="stat-value">₹{orders.reduce((sum, o) => sum + o.total, 0)}</span>
                  </div>
                  <div className="stat-icon blue"><BarChart2 size={24} /></div>
                </div>
              </motion.div>
              
              {/* Daily Report Selector */}
              <motion.div className="glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ padding: '24px', marginTop: '24px' }}>
                <div className="section-header" style={{ marginBottom: '20px' }}>
                  <h2 className="section-title">Date Report</h2>
                  <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} onClick={(e) => { if(e.target.showPicker) e.target.showPicker(); }} className="form-input" style={{ width: 'auto', cursor: 'pointer' }} />
                </div>
                <div className="stats-grid">
                  <div className="glass-panel stat-card" style={{ border: '1px solid rgba(255,165,0,0.3)' }}>
                    <div className="stat-info">
                      <span className="stat-label">Spins</span>
                      <span className="stat-value">{reportSpins}</span>
                    </div>
                    <div className="stat-icon purple"><Gift size={24} /></div>
                  </div>
                  <div className="glass-panel stat-card" style={{ border: '1px solid rgba(255,165,0,0.3)' }}>
                    <div className="stat-info">
                      <span className="stat-label">Sales (₹)</span>
                      <span className="stat-value">₹{reportSales}</span>
                    </div>
                    <div className="stat-icon orange"><BarChart2 size={24} /></div>
                  </div>
                  <div className="glass-panel stat-card" style={{ border: '1px solid rgba(255,165,0,0.3)' }}>
                    <div className="stat-info">
                      <span className="stat-label">Pizzas Sold</span>
                      <span className="stat-value">{reportPizzas}</span>
                    </div>
                    <div className="stat-icon yellow"><Pizza size={24} /></div>
                  </div>
                  <div className="glass-panel stat-card" style={{ border: '1px solid rgba(255,50,50,0.3)' }}>
                    <div className="stat-info">
                      <span className="stat-label">Expenses (₹)</span>
                      <span className="stat-value">₹{reportExpenses}</span>
                    </div>
                    <div className="stat-icon orange"><BarChart2 size={24} /></div>
                  </div>
                  <div className="glass-panel stat-card" style={{ border: '1px solid rgba(34,197,94,0.3)' }}>
                    <div className="stat-info">
                      <span className="stat-label">Profit (₹)</span>
                      <span className="stat-value">₹{reportSales - reportExpenses}</span>
                    </div>
                    <div className="stat-icon green"><BarChart2 size={24} /></div>
                  </div>
                </div>
              </motion.div>

              {/* Orders Table */}
              <motion.div className="glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ padding: '24px' }}>
                <div className="section-header">
                  <h2 className="section-title">Recent Orders</h2>
                  <div className="filter-group">
                    <button className={`filter-btn ${orderFilter === 'all' ? 'active' : ''}`} onClick={() => setOrderFilter('all')}>All</button>
                    <button className={`filter-btn ${orderFilter === 'new' ? 'active' : ''}`} onClick={() => setOrderFilter('new')}>New</button>
                    <button className={`filter-btn ${orderFilter === 'preparing' ? 'active' : ''}`} onClick={() => setOrderFilter('preparing')}>Preparing</button>
                  </div>
                </div>

                <div className="orders-table-wrapper">
                  <table className="orders-table font-inter">
                    <thead>
                      <tr>
                        <th>Source & ID</th>
                        <th>Customer & Location</th>
                        <th>Items & Total</th>
                        <th>Status</th>
                        <th>Timing</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredOrders.length === 0 ? (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No orders found.</td></tr>
                        ) : (
                          filteredOrders.map((order) => (
                            <motion.tr key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                              <td>
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{order.id}</div>
                                {order.source === 'whatsapp' ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#25D366', fontSize: '12px' }}><MessageCircle size={14} /> WhatsApp</div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--info)', fontSize: '12px' }}><Phone size={14} /> Phone Call</div>
                                )}
                              </td>
                              <td>
                                <div className="customer-info">
                                  <div className="customer-avatar">{order.customerName.charAt(0).toUpperCase()}</div>
                                  <div className="customer-details">
                                    <span className="customer-name">{order.customerName}</span>
                                    <span className="customer-phone">{order.phone}</span>
                                    {order.village && <span style={{ fontSize: '12px', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} /> {order.village}</span>}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="order-items">
                                  {order.items.map((item, i) => (
                                    <div key={i} className="order-item"><span className="item-qty">{item.qty}x</span><span>{item.name}</span></div>
                                  ))}
                                  {order.offerName && <div style={{ fontSize: '12px', color: 'var(--accent-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Gift size={12} /> {order.offerName}</div>}
                                  <div style={{ marginTop: '4px', fontWeight: 600, color: 'var(--success)' }}>Total: ₹ {order.total}</div>
                                </div>
                              </td>
                              <td>
                                <span className={`status-badge status-${order.status}`}>
                                  {getStatusIcon(order.status)}
                                  {getStatusText(order.status)}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                                  <div style={{ color: 'var(--text-secondary)' }}>Ordered: {order.orderTime}</div>
                                  <div style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}><Timer size={12} /> Dlvry: {order.deliveryTime}</div>
                                </div>
                              </td>
                              <td>
                                <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                  <button className="btn-icon" title="Print Receipt" onClick={() => setPrintOrder(order)}><Printer size={16} /></button>
                                  {order.status === 'new' && <button className="btn-icon" title="Start Preparing" onClick={() => markAsPreparing(order.id)}><ChefHat size={16} /></button>}
                                  {order.status === 'preparing' && <button className="btn-icon success" title="Mark as Ready" onClick={() => markAsReady(order.id)}><CheckCircle2 size={16} /></button>}
                                  <button className="btn-icon" title="More options"><MoreVertical size={16} /></button>
                                </div>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <motion.div className="glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '24px' }}>
              <div className="section-header">
                <h2 className="section-title">Manage Customer Reviews</h2>
              </div>
              <div className="orders-table-wrapper">
                <table className="orders-table font-inter">
                  <thead>
                    <tr>
                      <th>Customer & Location</th>
                      <th>Rating</th>
                      <th>Review Comment</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {reviews.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No reviews found.</td></tr>
                      ) : (
                        reviews.map((review) => (
                          <motion.tr key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <td>
                              <div className="customer-info">
                                <div className="customer-avatar">{review.customerName.charAt(0).toUpperCase()}</div>
                                <div className="customer-details">
                                  <span className="customer-name">{review.customerName}</span>
                                  {review.village && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><MapPin size={10} style={{display:'inline'}}/> {review.village}</span>}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', color: 'var(--warning)', gap: '2px' }}>
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                                ))}
                              </div>
                            </td>
                            <td style={{ maxWidth: '300px', whiteSpace: 'normal', lineHeight: '1.4' }}>{review.text}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{review.date}</td>
                            <td>
                              <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                <button className="btn-icon" onClick={() => openReviewModal(review)} title="Edit Review"><Edit2 size={16} /></button>
                                <button className="btn-icon danger" onClick={() => handleDeleteReview(review.id)} title="Delete Review"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Offers Tab */}
          {activeTab === 'locations' && (
            <motion.div className="glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '24px' }}>
              <div className="section-header">
                <h2 className="section-title">Manage Delivery Villages</h2>
              </div>
              
              <form onSubmit={handleAddVillage} style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter new village name..." 
                  value={newVillageName}
                  onChange={e => setNewVillageName(e.target.value)}
                  required 
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary">Add Village</button>
              </form>

              <div className="orders-table-wrapper">
                <table className="orders-table font-inter" style={{ minWidth: '100%' }}>
                  <thead>
                    <tr>
                      <th>Village Name</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {villages.map((village) => (
                        <motion.tr key={village.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MapPin size={16} color="var(--accent-primary)" /> {village.name}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn-icon" onClick={() => handleEditVillage(village)} title="Edit Village"><Edit2 size={16} /></button>
                              <button className="btn-icon danger" onClick={() => handleDeleteVillage(village.id)} title="Delete Village"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'offers' && (
            <motion.div className="glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '24px' }}>
              <div className="section-header">
                <h2 className="section-title">Manage Spinner Wheel Offers</h2>
                <button className="btn-secondary" onClick={() => window.resetPrizesToDefault && window.resetPrizesToDefault()} style={{ fontSize: '12px', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                  Restore Original Wheel Offers
                </button>
              </div>
              <div className="orders-table-wrapper">
                <table className="orders-table font-inter">
                  <thead>
                    <tr>
                      <th>Offer Label / Prize Text</th>
                      <th>Discount Value (₹)</th>
                      <th>Probability (%)</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {offers.length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>Loading offers from Firestore...</td></tr>
                      ) : (
                        offers.map((offer) => (
                          <motion.tr key={offer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Gift size={16} color="var(--accent-primary)" /> {offer.label}
                                {!offer.enabled && <span style={{fontSize: '11px', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '2px 6px', borderRadius: '4px'}}>DISABLED</span>}
                              </div>
                            </td>
                            <td>
                              {offer.discount > 0 ? (
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>₹ {offer.discount}</span>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)' }}>No Discount Amount</span>
                              )}
                            </td>
                            <td>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {offer.weight}%
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                <button className="btn-icon" onClick={() => openOfferModal(offer)} title="Edit Offer"><Edit2 size={16} /></button>
                                <button className="btn-icon danger" onClick={() => handleDeleteOffer(offer.id, offer.originalId)} title="Delete Offer"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <motion.div className="glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '24px' }}>
              <div className="section-header">
                <h2 className="section-title">Add Daily Expense</h2>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if(!newExpenseName || !newExpenseAmount) return;
                try {
                  const docRef = await addDoc(collection(db, "expenses"), {
                    name: newExpenseName,
                    amount: Number(newExpenseAmount),
                    createdAt: serverTimestamp()
                  });
                  setExpenses([{ id: docRef.id, name: newExpenseName, amount: Number(newExpenseAmount), createdAt: { toDate: () => new Date() } }, ...expenses]);
                  setNewExpenseName('');
                  setNewExpenseAmount('');
                } catch(err) {
                  alert("Failed to add expense");
                }
              }} style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <input list="expense-options" className="form-input" placeholder="Expense description (e.g. Cheese, Chicken)..." value={newExpenseName} onChange={e => setNewExpenseName(e.target.value)} required style={{ flex: 2, minWidth: '200px' }} />
                <datalist id="expense-options">
                  <option value="Cheese" />
                  <option value="Chicken" />
                  <option value="Maida" />
                  <option value="Vegetable" />
                  <option value="Packaging" />
                  <option value="Fuel" />
                </datalist>
                <input type="number" className="form-input" placeholder="Amount (₹)" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} required style={{ flex: 1, minWidth: '100px' }} />
                <button type="submit" className="btn-primary" style={{ flexShrink: 0 }}>Add Expense</button>
              </form>

              <div className="orders-table-wrapper">
                <table className="orders-table font-inter">
                  <thead>
                    <tr>
                      <th>Expense Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {expenses.map((exp) => (
                        <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {exp.createdAt && exp.createdAt.toDate ? exp.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Just now"}
                          </td>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{exp.name}</td>
                          <td style={{ color: 'var(--danger)', fontWeight: 600 }}>₹{exp.amount}</td>
                          <td>
                            <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn-icon danger" onClick={async () => {
                                if(window.confirm('Delete this expense?')) {
                                  try {
                                    await deleteDoc(doc(db, "expenses", exp.id));
                                    setExpenses(expenses.filter(e => e.id !== exp.id));
                                  } catch(e) { alert("Failed to delete"); }
                                }
                              }} title="Delete Expense"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No expenses found.</td></tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* --- Modals --- */}
      
      {/* 1. Add Order Modal */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
              <div className="modal-header">
                <h2 className="modal-title">Manual Order Entry</h2>
                <button className="modal-close" onClick={() => setIsOrderModalOpen(false)}><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmitOrder}>
                <div className="form-group">
                  <label className="form-label">Order Source</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className={`filter-btn ${newOrder.source === 'call' ? 'active' : ''}`} onClick={() => setNewOrder({ ...newOrder, source: 'call' })} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
                      <Phone size={16} /> Phone Call
                    </button>
                    <button type="button" className={`filter-btn ${newOrder.source === 'whatsapp' ? 'active' : ''}`} onClick={() => setNewOrder({ ...newOrder, source: 'whatsapp' })} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
                      <MessageCircle size={16} /> WhatsApp
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer Name</label>
                    <input type="text" className="form-input" placeholder="E.g., John Doe" value={newOrder.customerName} onChange={e => setNewOrder({ ...newOrder, customerName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="text" className="form-input" placeholder="+91..." value={newOrder.phone} onChange={e => setNewOrder({ ...newOrder, phone: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Village / Location</label>
                    <input list="villages" className="form-input" placeholder="Select or type village..." value={newOrder.village} onChange={e => setNewOrder({ ...newOrder, village: e.target.value })} />
                    <datalist id="villages">{villages.map(v => <option key={v.id} value={v.name} />)}</datalist>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Delivery Time</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select className="form-input" value={newOrder.deliveryTimeMode} onChange={e => setNewOrder({ ...newOrder, deliveryTimeMode: e.target.value })} style={{ width: '120px' }}>
                        <option value="auto">Auto (45m)</option>
                        <option value="custom">Custom</option>
                      </select>
                      {newOrder.deliveryTimeMode === 'custom' && (
                        <input type="time" className="form-input" value={newOrder.customDeliveryTime} onChange={e => setNewOrder({ ...newOrder, customDeliveryTime: e.target.value })} required />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Gift size={16} color="var(--accent-primary)"/> Discount / Offer</label>
                  <select 
                    className="form-input" 
                    value={newOrder.offerId}
                    onChange={e => setNewOrder({ ...newOrder, offerId: e.target.value })}
                    style={{ borderColor: newOrder.offerId !== 'none' ? 'var(--accent-primary)' : 'var(--border-color)' }}
                  >
                    <option value="none">No Offer applied</option>
                    {offers.map(offer => <option key={offer.id} value={offer.id}>{offer.label}</option>)}
                    <option value="custom">Custom Special Discount...</option>
                  </select>

                  {newOrder.offerId === 'custom' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <input type="text" className="form-input" placeholder="Reason" value={newOrder.customOfferName} onChange={e => setNewOrder({ ...newOrder, customOfferName: e.target.value })} required />
                      </div>
                      <div style={{ width: '120px' }}>
                        <input type="number" className="form-input" placeholder="₹ Amount" min="0" value={newOrder.customOfferAmount} onChange={e => setNewOrder({ ...newOrder, customOfferAmount: e.target.value })} required />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-input" value={newOrder.paymentMethod} onChange={e => setNewOrder({...newOrder, paymentMethod: e.target.value})}>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Status</label>
                    <select className="form-input" value={newOrder.paymentStatus} onChange={e => setNewOrder({...newOrder, paymentStatus: e.target.value})} style={{ borderColor: newOrder.paymentStatus === 'PAID' ? 'var(--success)' : 'var(--danger)' }}>
                      <option value="PAID">PAID</option>
                      <option value="UNPAID">UNPAID</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Order Items</label>
                  {newOrder.items.map((item, index) => (
                    <div className="order-item-input" key={index}>
                      <select className="form-input" value={item.name} onChange={e => handleOrderItemChange(index, e.target.value)} required style={{ flex: 1 }}>
                        <option value="" disabled>Select pizza / item...</option>
                        {MENU_ITEMS.map(mi => <option key={mi.id} value={mi.name}>{mi.name} - ₹{mi.price}</option>)}
                      </select>
                      <input type="number" className="form-input qty-input" min="1" value={item.qty} onChange={e => handleOrderQtyChange(index, parseInt(e.target.value))} />
                      {newOrder.items.length > 1 && <button type="button" className="btn-icon danger" onClick={() => handleRemoveOrderItem(index)}><X size={16} /></button>}
                    </div>
                  ))}
                  
                  <button type="button" className="add-item-btn" onClick={handleAddOrderItem}>+ Add Another Item</button>

                  <div style={{ marginTop: '16px', textAlign: 'right', fontSize: '15px' }}>
                    Subtotal: ₹{newOrder.items.reduce((s, i) => s + (i.price * i.qty), 0)} <br/>
                    {newOrder.offerId === 'custom' ? (
                      newOrder.customOfferAmount && <span style={{ color: 'var(--accent-primary)' }}>Discount: -₹{newOrder.customOfferAmount} <br/></span>
                    ) : (
                      newOrder.offerId !== 'none' && <span style={{ color: 'var(--accent-primary)' }}>Discount: -₹{offers.find(o => o.id === newOrder.offerId)?.discount || 0} <br/></span>
                    )}
                    <div style={{ fontWeight: 700, fontSize: '20px', marginTop: '8px' }}>Total: <span style={{ color: 'var(--success)' }}>₹ {calculateTotal()}</span></div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsOrderModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Create Order</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Review Form Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
              <div className="modal-header">
                <h2 className="modal-title">{editingReview ? 'Edit Review' : 'Add New Review'}</h2>
                <button className="modal-close" onClick={() => setIsReviewModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveReview}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer Name</label>
                    <input type="text" className="form-input" value={reviewForm.customerName} onChange={e => setReviewForm({...reviewForm, customerName: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Village / Location</label>
                    <input list="villages" className="form-input" value={reviewForm.village} onChange={e => setReviewForm({...reviewForm, village: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Rating (1-5)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1,2,3,4,5].map(num => (
                      <Star 
                        key={num} 
                        size={24} 
                        fill={num <= reviewForm.rating ? "var(--warning)" : "none"} 
                        color={num <= reviewForm.rating ? "var(--warning)" : "var(--text-secondary)"}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setReviewForm({...reviewForm, rating: num})}
                      />
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Review Comment</label>
                  <textarea 
                    className="form-input" 
                    rows="4" 
                    value={reviewForm.text} 
                    onChange={e => setReviewForm({...reviewForm, text: e.target.value})} 
                    required 
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsReviewModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Review</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Offer Form Modal */}
      <AnimatePresence>
        {isOfferModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
              <div className="modal-header">
                <h2 className="modal-title">{editingOffer ? 'Edit Offer' : 'Add New Offer'}</h2>
                <button className="modal-close" onClick={() => setIsOfferModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveOffer}>
                <div className="form-group">
                  <label className="form-label">Full Offer Name (For dropdowns/reports)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. ₹50 OFF On Large Pizza"
                    value={offerForm.label} 
                    onChange={e => setOfferForm({...offerForm, label: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Wheel Main Text</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. ₹50 OFF"
                      value={offerForm.wheelLabel} 
                      onChange={e => setOfferForm({...offerForm, wheelLabel: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Wheel Subtext (Optional)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. On Large Pizza"
                      value={offerForm.subLabel} 
                      onChange={e => setOfferForm({...offerForm, subLabel: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Discount Value (₹)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="0"
                      placeholder="e.g. 50"
                      value={offerForm.discount} 
                      onChange={e => setOfferForm({...offerForm, discount: parseInt(e.target.value) || 0})} 
                      required 
                    />
                    <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                      Set to 0 for free items.
                    </small>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Probability (%)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="0"
                      max="100"
                      placeholder="e.g. 10"
                      value={offerForm.weight} 
                      onChange={e => setOfferForm({...offerForm, weight: parseInt(e.target.value) || 0})} 
                      required 
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsOfferModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Offer</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
