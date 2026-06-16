import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Customer,
  Nurse,
  CarePlan,
  CareTask,
  ScheduleEntry,
  MealPlan,
  MealRecipe,
  InventoryItem,
  Equipment,
  MaintenanceWorkOrder,
  Room,
  SparePart,
} from '@/types';
import {
  customers as initialCustomers,
  nurses as initialNurses,
  carePlans as initialCarePlans,
  careTasks as initialCareTasks,
  scheduleEntries as initialScheduleEntries,
  mealPlans as initialMealPlans,
  mealRecipes as initialMealRecipes,
  inventoryItems as initialInventoryItems,
  equipmentList as initialEquipment,
  maintenanceWorkOrders as initialMaintenanceWorkOrders,
  rooms as initialRooms,
  spareParts as initialSpareParts,
} from '@/data/mockData';

interface AppState {
  customers: Customer[];
  nurses: Nurse[];
  carePlans: CarePlan[];
  careTasks: CareTask[];
  scheduleEntries: ScheduleEntry[];
  mealPlans: MealPlan[];
  mealRecipes: MealRecipe[];
  inventoryItems: InventoryItem[];
  equipment: Equipment[];
  maintenanceWorkOrders: MaintenanceWorkOrder[];
  spareParts: SparePart[];
  rooms: Room[];

  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addNurse: (nurse: Nurse) => void;
  updateNurse: (id: string, data: Partial<Nurse>) => void;
  deleteNurse: (id: string) => void;

  addCarePlan: (plan: CarePlan) => void;
  updateCarePlan: (id: string, data: Partial<CarePlan>) => void;
  deleteCarePlan: (id: string) => void;

  addCareTask: (task: CareTask) => void;
  updateCareTask: (id: string, data: Partial<CareTask>) => void;
  deleteCareTask: (id: string) => void;

  addScheduleEntry: (entry: ScheduleEntry) => void;
  updateScheduleEntry: (id: string, data: Partial<ScheduleEntry>) => void;
  deleteScheduleEntry: (id: string) => void;

  addMealPlan: (plan: MealPlan) => void;
  updateMealPlan: (id: string, data: Partial<MealPlan>) => void;
  deleteMealPlan: (id: string) => void;

  addMealRecipe: (recipe: MealRecipe) => void;
  updateMealRecipe: (id: string, data: Partial<MealRecipe>) => void;
  deleteMealRecipe: (id: string) => void;

  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;

  addEquipment: (item: Equipment) => void;
  updateEquipment: (id: string, data: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;

  addMaintenanceWorkOrder: (order: MaintenanceWorkOrder) => void;
  updateMaintenanceWorkOrder: (id: string, data: Partial<MaintenanceWorkOrder>) => void;
  deleteMaintenanceWorkOrder: (id: string) => void;

  addSparePart: (part: SparePart) => void;
  updateSparePart: (id: string, data: Partial<SparePart>) => void;
  deleteSparePart: (id: string) => void;

  addRoom: (room: Room) => void;
  updateRoom: (id: string, data: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      customers: initialCustomers,
      nurses: initialNurses,
      carePlans: initialCarePlans,
      careTasks: initialCareTasks,
      scheduleEntries: initialScheduleEntries,
      mealPlans: initialMealPlans,
      mealRecipes: initialMealRecipes,
      inventoryItems: initialInventoryItems,
      equipment: initialEquipment,
      maintenanceWorkOrders: initialMaintenanceWorkOrders,
      spareParts: initialSpareParts,
      rooms: initialRooms,

      addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
      updateCustomer: (id, data) => set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? { ...c, ...data } : c)),
      })),
      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
      })),

      addNurse: (nurse) => set((state) => ({ nurses: [...state.nurses, nurse] })),
      updateNurse: (id, data) => set((state) => ({
        nurses: state.nurses.map((n) => (n.id === id ? { ...n, ...data } : n)),
      })),
      deleteNurse: (id) => set((state) => ({
        nurses: state.nurses.filter((n) => n.id !== id),
      })),

      addCarePlan: (plan) => set((state) => ({ carePlans: [...state.carePlans, plan] })),
      updateCarePlan: (id, data) => set((state) => ({
        carePlans: state.carePlans.map((p) => (p.id === id ? { ...p, ...data } : p)),
      })),
      deleteCarePlan: (id) => set((state) => ({
        carePlans: state.carePlans.filter((p) => p.id !== id),
      })),

      addCareTask: (task) => set((state) => ({ careTasks: [...state.careTasks, task] })),
      updateCareTask: (id, data) => set((state) => ({
        careTasks: state.careTasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
      })),
      deleteCareTask: (id) => set((state) => ({
        careTasks: state.careTasks.filter((t) => t.id !== id),
      })),

      addScheduleEntry: (entry) => set((state) => ({ scheduleEntries: [...state.scheduleEntries, entry] })),
      updateScheduleEntry: (id, data) => set((state) => ({
        scheduleEntries: state.scheduleEntries.map((e) => (e.id === id ? { ...e, ...data } : e)),
      })),
      deleteScheduleEntry: (id) => set((state) => ({
        scheduleEntries: state.scheduleEntries.filter((e) => e.id !== id),
      })),

      addMealPlan: (plan) => set((state) => ({ mealPlans: [...state.mealPlans, plan] })),
      updateMealPlan: (id, data) => set((state) => ({
        mealPlans: state.mealPlans.map((p) => (p.id === id ? { ...p, ...data } : p)),
      })),
      deleteMealPlan: (id) => set((state) => ({
        mealPlans: state.mealPlans.filter((p) => p.id !== id),
      })),

      addMealRecipe: (recipe) => set((state) => ({ mealRecipes: [...state.mealRecipes, recipe] })),
      updateMealRecipe: (id, data) => set((state) => ({
        mealRecipes: state.mealRecipes.map((r) => (r.id === id ? { ...r, ...data } : r)),
      })),
      deleteMealRecipe: (id) => set((state) => ({
        mealRecipes: state.mealRecipes.filter((r) => r.id !== id),
      })),

      addInventoryItem: (item) => set((state) => ({ inventoryItems: [...state.inventoryItems, item] })),
      updateInventoryItem: (id, data) => set((state) => ({
        inventoryItems: state.inventoryItems.map((i) => (i.id === id ? { ...i, ...data } : i)),
      })),
      deleteInventoryItem: (id) => set((state) => ({
        inventoryItems: state.inventoryItems.filter((i) => i.id !== id),
      })),

      addEquipment: (item) => set((state) => ({ equipment: [...state.equipment, item] })),
      updateEquipment: (id, data) => set((state) => ({
        equipment: state.equipment.map((e) => (e.id === id ? { ...e, ...data } : e)),
      })),
      deleteEquipment: (id) => set((state) => ({
        equipment: state.equipment.filter((e) => e.id !== id),
      })),

      addMaintenanceWorkOrder: (order) => set((state) => ({ maintenanceWorkOrders: [...state.maintenanceWorkOrders, order] })),
      updateMaintenanceWorkOrder: (id, data) => set((state) => ({
        maintenanceWorkOrders: state.maintenanceWorkOrders.map((o) => (o.id === id ? { ...o, ...data } : o)),
      })),
      deleteMaintenanceWorkOrder: (id) => set((state) => ({
        maintenanceWorkOrders: state.maintenanceWorkOrders.filter((o) => o.id !== id),
      })),

      addSparePart: (part) => set((state) => ({ spareParts: [...state.spareParts, part] })),
      updateSparePart: (id, data) => set((state) => ({
        spareParts: state.spareParts.map((p) => (p.id === id ? { ...p, ...data } : p)),
      })),
      deleteSparePart: (id) => set((state) => ({
        spareParts: state.spareParts.filter((p) => p.id !== id),
      })),

      addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),
      updateRoom: (id, data) => set((state) => ({
        rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...data } : r)),
      })),
      deleteRoom: (id) => set((state) => ({
        rooms: state.rooms.filter((r) => r.id !== id),
      })),
    }),
    {
      name: 'mch-center-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
