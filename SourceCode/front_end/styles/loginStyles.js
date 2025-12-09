import { StyleSheet } from "react-native";

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: '#FF6B35',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
  },
  circle2: {
    position: 'absolute',
    top: 100,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },

  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },

  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 28,
  },

  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  inputIconContainer: {
    position: 'absolute',
    left: 16,
    top: 14,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputIcon: {
    fontSize: 18,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    paddingLeft: 60,
    fontSize: 15,
    borderWidth: 2,
    borderColor: '#E8EAED',
  },
  inputFocused: {
    borderColor: '#FF6B35',
    backgroundColor: '#fff',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  loginButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },

  cardFooter: {
    marginTop: 24,
    alignItems: 'center',
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#E8EAED',
    borderRadius: 2,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },

  bottomInfo: {
    marginTop: 32,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  copyrightText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
});
