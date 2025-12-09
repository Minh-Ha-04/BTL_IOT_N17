import { StyleSheet } from "react-native";

export default StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { padding: 20, paddingBottom: 40 },

  header: { 
    backgroundColor: '#FF6B35',
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 24,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: { fontSize: 28 },

  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },

  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },

  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF4F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIcon: { fontSize: 22 },
  cardTitle: { fontSize: 19, fontWeight: '700', flex: 1 },

  badge: { backgroundColor: '#FF6B35', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#E8EAED',
  },

  primaryBtn: {
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 12, opacity: 0.5 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#666' },
  emptySubtext: { fontSize: 14, color: '#999' },

  userList: { gap: 12 },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8EAED',
  },

  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  userName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  roleTag: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, borderRadius: 6 },
  roleText: { color: '#1976D2', fontSize: 11, fontWeight: '600' },

  deleteBtn: {
    backgroundColor: '#FFEBEE',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FFCDD2',
    borderWidth: 1,
  },
  deleteBtnText: { fontSize: 18 },
});
