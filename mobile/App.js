import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView, 
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Modal,
  Linking,
} from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

// Prevent splash screen from auto-hiding before state is ready
SplashScreen.preventAutoHideAsync().catch(() => {});

const API_BASE_URL = 'https://educonnect-gh.onrender.com/api';

// Shared HTTP client. The 45s timeout is deliberate: Render's free tier spins
// the backend down after ~15 minutes of inactivity, and the first request
// after that can take 30-60s while the container wakes up. Axios has no
// timeout by default, so without this a "cold" request could hang or fail
// in a way that's indistinguishable from a real connectivity problem.
const api = axios.create({ baseURL: API_BASE_URL, timeout: 45000 });

/**
 * Turns an axios error into a specific, honest (title, message) pair instead
 * of a generic "check your network" string. Distinguishes three genuinely
 * different failure modes:
 *  - The server responded with an error (bad credentials, validation, 500) -
 *    show its actual message.
 *  - The request timed out - most likely a Render cold start.
 *  - No response was ever received (DNS/offline/connection refused).
 */
function describeRequestError(error) {
  if (error.response) {
    const status = error.response.status;
    const serverMessage = error.response.data?.message;
    return {
      title: status === 401 ? 'Incorrect Credentials' : 'Request Failed',
      message: serverMessage || `The server responded with an error (status ${status}).`,
    };
  }

  if (error.code === 'ECONNABORTED') {
    return {
      title: 'Request Timed Out',
      message:
        'The server took too long to respond. Our backend runs on a free tier and can take up to a minute to wake up after being idle — please try again.',
    };
  }

  return {
    title: 'Connection Problem',
    message: 'Could not reach the EduConnect GH server. Check your internet connection and try again.',
  };
}

// --- AUTH CONTEXT ---
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- DOMAIN CONSTANTS (must match backend enums exactly, see backend/models) ---
const PROCESS_TYPES = [
  'Course Registration',
  'Semester Registration',
  'Exams Registration',
  'Re-sit Registration',
  'Transcript Request',
  'Clearance Form',
  'Industrial Attachment',
  'Change of Program',
  'Hostel Application',
  'Other',
];
const SEMESTERS = ['Semester 1', 'Semester 2', 'Trimester 1', 'Trimester 2', 'Trimester 3'];
const PROCESS_STATUS_FILTERS = ['All', 'Pending', 'In Review', 'Approved', 'Rejected'];
const MATERIAL_TYPES = ['Lecture Slides', 'Past Questions', 'Handout', 'Video', 'Reading List', 'Other'];
const MATERIAL_LEVEL_FILTERS = ['All', '100', '200', '300', '400', '500'];
const ANNOUNCEMENT_AUDIENCES = ['All', 'Students', 'Lecturers', 'Level 100', 'Level 200', 'Level 300', 'Level 400'];
const ANNOUNCEMENT_PRIORITIES = ['Normal', 'Important', 'Urgent'];

// --- SHARED DASHBOARD UI HELPERS ---
const STATUS_COLORS = {
  Pending: { bg: '#FDF6E8', text: '#B8861B' },
  'In Review': { bg: '#EAF1FB', text: '#2A3D68' },
  Approved: { bg: '#EAF9F0', text: '#188044' },
  Rejected: { bg: '#FCEDED', text: '#B23434' },
  Active: { bg: '#EAF9F0', text: '#188044' },
  Inactive: { bg: '#FCEDED', text: '#B23434' },
  Normal: { bg: '#F1F5F9', text: '#475569' },
  Important: { bg: '#FDF6E8', text: '#B8861B' },
  Urgent: { bg: '#FCEDED', text: '#B23434' },
};

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { bg: '#F1F5F9', text: '#475569' };
  return (
    <View style={[styles.badgePill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgePillText, { color: colors.text }]}>{status}</Text>
    </View>
  );
}

function EmptyState({ icon = 'checkmark-done-circle-outline', message }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={36} color="#94A3B8" />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

function PillSelector({ options, value, onChange }) {
  return (
    <View style={styles.levelPillRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.levelPill, value === opt && styles.levelPillActive]}
          onPress={() => onChange(opt)}
          activeOpacity={0.8}
        >
          <Text style={[styles.levelPillText, value === opt && styles.levelPillTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color }]}>
        <Ionicons name={icon} size={18} color="#F8FAFC" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProfileInfoRow({ icon, label, value }) {
  return (
    <View style={styles.profileInfoRow}>
      <Ionicons name={icon} size={18} color="#64748b" style={{ marginRight: 10 }} />
      <View>
        <Text style={styles.profileInfoLabel}>{label}</Text>
        <Text style={styles.profileInfoValue}>{value}</Text>
      </View>
    </View>
  );
}

// --- PAGES ---
function ProcessesScreen() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'lecturer';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remarksDraft, setRemarksDraft] = useState({});

  const [type, setType] = useState(PROCESS_TYPES[0]);
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [description, setDescription] = useState('');

  const fetchData = async () => {
    try {
      const params = {};
      if (isStaff && filter !== 'All') params.status = filter;
      const res = await api.get('/process', { params });
      setItems(res.data.data || []);
    } catch (error) {
      const { title, message } = describeRequestError(error);
      Alert.alert(title, message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const resetForm = () => {
    setType(PROCESS_TYPES[0]);
    setAcademicYear('');
    setSemester(SEMESTERS[0]);
    setDescription('');
  };

  const handleSubmitRequest = async () => {
    if (!academicYear.trim()) {
      Alert.alert('Missing Information', 'Please enter the academic year, e.g. 2025/2026');
      return;
    }
    if (!/^\d{4}\/\d{4}$/.test(academicYear.trim())) {
      Alert.alert('Invalid Format', 'Academic year must be in the format 2025/2026');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/process', {
        type,
        academicYear: academicYear.trim(),
        semester,
        description: description.trim(),
      });
      setModalVisible(false);
      resetForm();
      fetchData();
      Alert.alert('Request Submitted', 'Your process request has been submitted successfully.');
    } catch (error) {
      const { title, message } = describeRequestError(error);
      Alert.alert(title, message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/process/${id}`, { status, remarks: remarksDraft[id] || '' });
      fetchData();
    } catch (error) {
      const { title, message } = describeRequestError(error);
      Alert.alert(title, message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#0B0F19" />
      </View>
    );
  }

  return (
    <View style={styles.dashScreen}>
      <View style={styles.screenHeaderRow}>
        <Text style={styles.screenHeading}>{isStaff ? 'Process Requests' : 'My Requests'}</Text>
        {!isStaff && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#F8FAFC" />
            <Text style={styles.addBtnText}>New Request</Text>
          </TouchableOpacity>
        )}
      </View>

      {isStaff && <PillSelector options={PROCESS_STATUS_FILTERS} value={filter} onChange={setFilter} />}

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.dashScreenContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B0F19']} />}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            message={isStaff ? 'No requests match this filter.' : "You haven't submitted any requests yet."}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <View style={styles.requestCardHeader}>
              <Text style={styles.requestCardStudent} numberOfLines={1}>
                {isStaff ? item.student?.name || 'Unknown Student' : item.type}
              </Text>
              <StatusBadge status={item.status} />
            </View>
            {isStaff && <Text style={styles.requestCardType}>{item.type}</Text>}
            <Text style={styles.requestCardMeta}>
              {item.academicYear} · {item.semester} · {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {!!item.description && <Text style={styles.requestCardDescription}>{item.description}</Text>}
            {!!item.remarks && <Text style={styles.requestCardRemarks}>Remarks: {item.remarks}</Text>}

            {isStaff && (
              <>
                <TextInput
                  style={styles.remarksInput}
                  placeholder="Add remarks (optional)"
                  placeholderTextColor="#94a3b8"
                  value={remarksDraft[item._id] ?? ''}
                  onChangeText={(text) => setRemarksDraft((prev) => ({ ...prev, [item._id]: text }))}
                />
                <View style={styles.requestActionRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleUpdateStatus(item._id, 'Approved')}>
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reviewBtn} onPress={() => handleUpdateStatus(item._id, 'In Review')}>
                    <Text style={styles.reviewBtnText}>In Review</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleUpdateStatus(item._id, 'Rejected')}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>New Process Request</Text>

              <Text style={styles.label}>Process Type</Text>
              <PillSelector options={PROCESS_TYPES} value={type} onChange={setType} />

              <Text style={[styles.label, { marginTop: 16 }]}>Academic Year</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2025/2026"
                  placeholderTextColor="#94a3b8"
                  value={academicYear}
                  onChangeText={setAcademicYear}
                />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Semester</Text>
              <PillSelector options={SEMESTERS} value={semester} onChange={setSemester} />

              <Text style={[styles.label, { marginTop: 16 }]}>Details</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add any extra details for this request..."
                  placeholderTextColor="#94a3b8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSubmitRequest} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>Submit</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MaterialsScreen() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'lecturer';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [levelFilter, setLevelFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceType, setResourceType] = useState(MATERIAL_TYPES[0]);
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('All');
  const [semester, setSemester] = useState(SEMESTERS[0]);

  const fetchData = async () => {
    try {
      const params = {};
      if (levelFilter !== 'All') params.level = levelFilter;
      const res = await api.get('/materials', { params });
      setItems(res.data.data || []);
    } catch (error) {
      const { title: t, message } = describeRequestError(error);
      Alert.alert(t, message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [levelFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCourseCode('');
    setCourseName('');
    setResourceUrl('');
    setResourceType(MATERIAL_TYPES[0]);
    setDepartment('');
    setLevel('All');
    setSemester(SEMESTERS[0]);
  };

  const handleUpload = async () => {
    if (!title.trim() || !courseCode.trim() || !courseName.trim() || !resourceUrl.trim() || !department.trim()) {
      Alert.alert('Missing Information', 'Please fill in title, course code, course name, resource link and department.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/materials', {
        title: title.trim(),
        description: description.trim(),
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        resourceUrl: resourceUrl.trim(),
        resourceType,
        department: department.trim(),
        level,
        semester,
      });
      setModalVisible(false);
      resetForm();
      fetchData();
      Alert.alert('Uploaded', 'Course material added successfully.');
    } catch (error) {
      const { title: t, message } = describeRequestError(error);
      Alert.alert(t, message);
    } finally {
      setSubmitting(false);
    }
  };

  const openResource = (url) => {
    Linking.openURL(url).catch(() => Alert.alert('Cannot Open Link', 'This resource link appears to be invalid.'));
  };

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#0B0F19" />
      </View>
    );
  }

  return (
    <View style={styles.dashScreen}>
      <View style={styles.screenHeaderRow}>
        <Text style={styles.screenHeading}>Course Materials</Text>
        {isStaff && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#F8FAFC" />
            <Text style={styles.addBtnText}>Upload</Text>
          </TouchableOpacity>
        )}
      </View>

      <PillSelector options={MATERIAL_LEVEL_FILTERS} value={levelFilter} onChange={setLevelFilter} />

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.dashScreenContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B0F19']} />}
        ListEmptyComponent={<EmptyState icon="book-outline" message="No course materials found for this level yet." />}
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <View style={styles.requestCardHeader}>
              <Text style={styles.requestCardStudent} numberOfLines={1}>{item.title}</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{item.courseCode}</Text>
              </View>
            </View>
            <Text style={styles.requestCardMeta}>
              Level {item.level} · {item.semester} · {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {!!item.description && <Text style={styles.requestCardDescription}>{item.description}</Text>}
            <TouchableOpacity style={styles.linkBtn} onPress={() => openResource(item.resourceUrl)}>
              <Ionicons name="open-outline" size={16} color="#0B0F19" />
              <Text style={styles.linkBtnText}>Open {item.resourceType}</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Upload Course Material</Text>

              <Text style={styles.label}>Title</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Week 3 Lecture Slides" placeholderTextColor="#94a3b8" />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Description (optional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Short description" placeholderTextColor="#94a3b8" />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Course Code</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={courseCode} onChangeText={setCourseCode} placeholder="e.g. CSM 261" placeholderTextColor="#94a3b8" autoCapitalize="characters" />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Course Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={courseName} onChangeText={setCourseName} placeholder="e.g. Data Structures" placeholderTextColor="#94a3b8" />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Resource URL</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={resourceUrl} onChangeText={setResourceUrl} placeholder="https://..." placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="url" />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Resource Type</Text>
              <PillSelector options={MATERIAL_TYPES} value={resourceType} onChange={setResourceType} />

              <Text style={[styles.label, { marginTop: 16 }]}>Department</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={department} onChangeText={setDepartment} placeholder="e.g. Computer Science" placeholderTextColor="#94a3b8" />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Level</Text>
              <PillSelector options={MATERIAL_LEVEL_FILTERS} value={level} onChange={setLevel} />

              <Text style={[styles.label, { marginTop: 16 }]}>Semester</Text>
              <PillSelector options={SEMESTERS} value={semester} onChange={setSemester} />

              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleUpload} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>Upload</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AnnouncementsScreen() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'lecturer';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState(ANNOUNCEMENT_AUDIENCES[0]);
  const [priority, setPriority] = useState(ANNOUNCEMENT_PRIORITIES[0]);

  const fetchData = async () => {
    try {
      const res = await api.get('/announcements');
      setItems(res.data.data || []);
    } catch (error) {
      const { title: t, message } = describeRequestError(error);
      Alert.alert(t, message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setAudience(ANNOUNCEMENT_AUDIENCES[0]);
    setPriority(ANNOUNCEMENT_PRIORITIES[0]);
  };

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Information', 'Please provide a title and message.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/announcements', { title: title.trim(), content: content.trim(), audience, priority });
      setModalVisible(false);
      resetForm();
      fetchData();
      Alert.alert('Posted', 'Your announcement has been broadcast.');
    } catch (error) {
      const { title: t, message } = describeRequestError(error);
      Alert.alert(t, message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#0B0F19" />
      </View>
    );
  }

  return (
    <View style={styles.dashScreen}>
      <View style={styles.screenHeaderRow}>
        <Text style={styles.screenHeading}>Announcements</Text>
        {isStaff && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#F8FAFC" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.dashScreenContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B0F19']} />}
        ListEmptyComponent={<EmptyState icon="megaphone-outline" message="No announcements yet." />}
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <View style={styles.requestCardHeader}>
              <Text style={styles.requestCardStudent} numberOfLines={1}>{item.title}</Text>
              <StatusBadge status={item.priority} />
            </View>
            <Text style={styles.requestCardDescription}>{item.content}</Text>
            <Text style={styles.requestCardMeta}>
              {item.audience} · By {item.postedBy?.name || 'Staff'} · {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>New Announcement</Text>

              <Text style={styles.label}>Title</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Mid-semester exams timetable" placeholderTextColor="#94a3b8" />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Message</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput style={[styles.input, styles.textArea]} value={content} onChangeText={setContent} placeholder="Write the announcement..." placeholderTextColor="#94a3b8" multiline />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Target Audience</Text>
              <PillSelector options={ANNOUNCEMENT_AUDIENCES} value={audience} onChange={setAudience} />

              <Text style={[styles.label, { marginTop: 16 }]}>Priority</Text>
              <PillSelector options={ANNOUNCEMENT_PRIORITIES} value={priority} onChange={setPriority} />

              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmitBtn} onPress={handlePost} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>Broadcast</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StudentsScreen() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'lecturer';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');

  const fetchData = async (query = search, lvl = levelFilter) => {
    try {
      const params = { role: 'student' };
      if (query.trim()) params.search = query.trim();
      if (lvl !== 'All') params.level = lvl;
      const res = await api.get('/users', { params });
      setItems(res.data.data || []);
    } catch (error) {
      const { title, message } = describeRequestError(error);
      Alert.alert(title, message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isStaff) fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [levelFilter])
  );

  // Debounce search-as-you-type so we don't fire a request on every keystroke
  useEffect(() => {
    if (!isStaff) return;
    const timer = setTimeout(() => fetchData(search, levelFilter), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (!isStaff) {
    return (
      <View style={styles.centerScreen}>
        <Ionicons name="lock-closed-outline" size={40} color="#94a3b8" />
        <Text style={styles.screenSubtitle}>This directory is only available to lecturers and administrators.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#0B0F19" />
      </View>
    );
  }

  return (
    <View style={styles.dashScreen}>
      <View style={styles.screenHeaderRow}>
        <Text style={styles.screenHeading}>Student Directory</Text>
      </View>

      <View style={styles.searchBarWrapper}>
        <Ionicons name="search-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchBarInput}
          placeholder="Search by name or index number"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <PillSelector options={['All', '100', '200', '300', '400', '500']} value={levelFilter} onChange={setLevelFilter} />

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.dashScreenContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B0F19']} />}
        ListEmptyComponent={<EmptyState icon="people-outline" message="No students match your search." />}
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <View style={styles.requestCardHeader}>
              <Text style={styles.requestCardStudent} numberOfLines={1}>{item.name}</Text>
              <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} />
            </View>
            <Text style={styles.requestCardMeta}>Index: {item.indexNumber || '—'}</Text>
            <Text style={styles.requestCardMeta}>{item.program || 'No program set'} · Level {item.level}</Text>
          </View>
        )}
      />
    </View>
  );
}

function ProfileScreen() {
  const { user, logout } = useAuth();

  const initials = (user?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const confirmLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.dashScreen} contentContainerStyle={styles.dashScreenContent}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.profileInfoCard}>
        {user?.role === 'student' ? (
          <>
            <ProfileInfoRow icon="card-outline" label="Index Number" value={user?.indexNumber || '—'} />
            <ProfileInfoRow icon="book-outline" label="Program" value={user?.program || '—'} />
            <ProfileInfoRow icon="business-outline" label="Department" value={user?.department || '—'} />
            <ProfileInfoRow icon="layers-outline" label="Level" value={user?.level || '—'} />
          </>
        ) : (
          <>
            <ProfileInfoRow icon="id-card-outline" label="Staff ID" value={user?.staffId || '—'} />
            <ProfileInfoRow icon="business-outline" label="Department" value={user?.department || '—'} />
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
        <Text style={styles.btnText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function DashboardOverviewScreen({ navigation }) {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'lecturer';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ students: 0, pending: 0, materials: 0, announcements: 0 });
  const [pendingList, setPendingList] = useState([]);
  const [studentSummary, setStudentSummary] = useState({
    recentProcesses: [],
    statusCounts: { Pending: 0, 'In Review': 0, Approved: 0, Rejected: 0 },
  });

  const fetchData = async () => {
    try {
      if (isStaff) {
        const [studentsRes, pendingCountRes, materialsRes, announcementsRes, pendingListRes] = await Promise.all([
          api.get('/users', { params: { role: 'student', limit: 1 } }),
          api.get('/process', { params: { status: 'Pending', limit: 1 } }),
          api.get('/materials', { params: { limit: 1 } }),
          api.get('/announcements', { params: { limit: 1, includeExpired: true } }),
          api.get('/process', { params: { status: 'Pending', limit: 5 } }),
        ]);
        setStats({
          students: studentsRes.data.total || 0,
          pending: pendingCountRes.data.total || 0,
          materials: materialsRes.data.total || 0,
          announcements: announcementsRes.data.total || 0,
        });
        setPendingList(pendingListRes.data.data || []);
      } else {
        const res = await api.get('/process/dashboard-summary');
        setStudentSummary(res.data.data);
      }
    } catch (error) {
      const { title, message } = describeRequestError(error);
      Alert.alert(title, message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStaff])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleQuickAction = async (id, status) => {
    try {
      await api.put(`/process/${id}`, { status });
      fetchData();
    } catch (error) {
      const { title, message } = describeRequestError(error);
      Alert.alert(title, message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#0B0F19" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.dashScreen}
      contentContainerStyle={styles.dashScreenContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B0F19']} />}
    >
      <Text style={styles.welcomeTitle}>Welcome, {user?.name || 'User'}!</Text>
      <View style={styles.rolePill}>
        <Text style={styles.rolePillText}>Role: {user?.role?.toUpperCase()}</Text>
      </View>

      {isStaff ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard icon="people-outline" label="Students" value={stats.students} color="#2A3D68" />
            <StatCard icon="clipboard-outline" label="Pending Requests" value={stats.pending} color="#CC8F2A" />
            <StatCard icon="book-outline" label="Course Materials" value={stats.materials} color="#188044" />
            <StatCard icon="megaphone-outline" label="Announcements" value={stats.announcements} color="#0B0F19" />
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Requests Needing Action</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Processes')}>
              <Text style={styles.viewAllLink}>View all →</Text>
            </TouchableOpacity>
          </View>

          {pendingList.length === 0 ? (
            <EmptyState icon="checkmark-done-circle-outline" message="No pending requests right now. You're all caught up." />
          ) : (
            pendingList.map((item) => (
              <View key={item._id} style={styles.requestCard}>
                <View style={styles.requestCardHeader}>
                  <Text style={styles.requestCardStudent} numberOfLines={1}>{item.student?.name || 'Unknown Student'}</Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.requestCardType}>{item.type}</Text>
                <Text style={styles.requestCardMeta}>{item.academicYear} · {item.semester}</Text>
                <View style={styles.requestActionRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleQuickAction(item._id, 'Approved')}>
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleQuickAction(item._id, 'Rejected')}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard icon="time-outline" label="Pending" value={studentSummary.statusCounts?.Pending || 0} color="#CC8F2A" />
            <StatCard icon="hourglass-outline" label="In Review" value={studentSummary.statusCounts?.['In Review'] || 0} color="#2A3D68" />
            <StatCard icon="checkmark-circle-outline" label="Approved" value={studentSummary.statusCounts?.Approved || 0} color="#188044" />
            <StatCard icon="close-circle-outline" label="Rejected" value={studentSummary.statusCounts?.Rejected || 0} color="#B23434" />
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Recent Requests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Processes')}>
              <Text style={styles.viewAllLink}>View all →</Text>
            </TouchableOpacity>
          </View>

          {(studentSummary.recentProcesses || []).length === 0 ? (
            <EmptyState icon="document-text-outline" message="You haven't submitted any requests yet." />
          ) : (
            studentSummary.recentProcesses.map((item) => (
              <View key={item._id} style={styles.requestCard}>
                <View style={styles.requestCardHeader}>
                  <Text style={styles.requestCardType}>{item.type}</Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.requestCardMeta}>{item.academicYear} · {item.semester}</Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

// --- MAIN DASHBOARD TAB NAVIGATOR ---
function DashboardLayout() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'lecturer';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'grid-outline';
          if (route.name === 'Overview') iconName = 'grid-outline';
          else if (route.name === 'Processes') iconName = 'document-text-outline';
          else if (route.name === 'Materials') iconName = 'book-outline';
          else if (route.name === 'Announcements') iconName = 'megaphone-outline';
          else if (route.name === 'Students') iconName = 'people-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0B0F19',
        tabBarInactiveTintColor: '#94a3b8',
        headerStyle: { backgroundColor: '#0B0F19' },
        headerTintColor: '#F8FAFC',
      })}
    >
      <Tab.Screen name="Overview" component={DashboardOverviewScreen} />
      <Tab.Screen name="Processes" component={ProcessesScreen} />
      <Tab.Screen name="Materials" component={MaterialsScreen} />
      <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
      {isStaff && <Tab.Screen name="Students" component={StudentsScreen} />}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// --- LANDING / MARKETING SCREEN ---
const LANDING_FEATURES = [
  {
    icon: 'document-text-outline',
    title: 'Processes',
    description: 'Submit and track registration, clearance and transcript requests.',
  },
  {
    icon: 'book-outline',
    title: 'Materials',
    description: 'Access lecture slides, past questions and reading lists by course.',
  },
  {
    icon: 'megaphone-outline',
    title: 'Announcements',
    description: 'Stay current with notices from lecturers and administration.',
  },
  {
    icon: 'people-outline',
    title: 'Student Directory',
    description: 'Lecturers and admins manage records and fee status in one view.',
  },
];

const STUDENT_ROLE_POINTS = [
  'Track every academic process request in one timeline',
  'Download course materials by course code and level',
  'Check fee balance and payment history',
  'Install as an app and keep browsing recent data offline',
];

const STAFF_ROLE_POINTS = [
  'Review and action student process requests',
  'Upload and manage course resources',
  'Broadcast notices to specific levels or the whole school',
  'Maintain student records and fee accounts',
];

function LandingScreen({ navigation }) {
  const scrollRef = useRef(null);
  const featuresOffsetY = useRef(0);

  const goToLogin = () => navigation.navigate('Login');
  const goToStaffLogin = () => navigation.navigate('Login', { intent: 'staff' });
  const goToRegister = () => navigation.navigate('Register');

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const scrollToFeatures = () => {
    scrollRef.current?.scrollTo({ y: featuresOffsetY.current, animated: true });
  };

  return (
    <SafeAreaView style={styles.landingSafeArea}>
      <StatusBar style="light" />
      <ScrollView
        ref={scrollRef}
        style={styles.landingScroll}
        contentContainerStyle={styles.landingScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.landingHeader}>
          <View style={styles.landingHeaderTopRow}>
            <View style={styles.landingBrand}>
              <View style={styles.landingBrandMark}>
                <Text style={styles.landingBrandMarkText}>EC</Text>
              </View>
              <Text style={styles.landingBrandName} numberOfLines={1} ellipsizeMode="tail">
                EduConnect
              </Text>
            </View>

            <View style={styles.landingHeaderActions}>
              <TouchableOpacity onPress={goToLogin} hitSlop={8} style={styles.landingLoginLink}>
                <Text style={styles.landingLoginLinkText}>Log in</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.landingHeaderCta}
                onPress={goToRegister}
                activeOpacity={0.85}
              >
                <Text style={styles.landingHeaderCtaText}>Get started</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.landingHeaderLinks}>
            <TouchableOpacity onPress={scrollToTop} hitSlop={8}>
              <Text style={styles.landingHeaderLinkText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={scrollToFeatures} hitSlop={8}>
              <Text style={styles.landingHeaderLinkText}>Features</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.landingHero}>
          <View style={styles.landingHeroGlowGold} pointerEvents="none" />
          <View style={styles.landingHeroGlowNavy} pointerEvents="none" />

          <View style={styles.landingBadge}>
            <Text style={styles.landingBadgeText}>Built for Ghanaian tertiary education</Text>
          </View>

          <Text style={styles.landingHeadline}>
            Your academic process, tracked from{' '}
            <Text style={styles.landingHeadlineAccent}>submission to approval</Text>.
          </Text>

          <Text style={styles.landingSubtitle}>
            EduConnect GH brings registration, clearance, course materials, fees and
            announcements into a single portal — for students, lecturers and administrators.
          </Text>

          <View style={styles.landingHeroActions}>
            <TouchableOpacity
              style={styles.landingPrimaryBtn}
              onPress={goToRegister}
              activeOpacity={0.85}
            >
              <Text style={styles.landingPrimaryBtnText}>Get started as a student →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.landingSecondaryBtn}
              onPress={goToStaffLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.landingSecondaryBtnText}>Staff sign in</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Preview Section */}
        <View
          style={styles.landingFeaturesSection}
          onLayout={(e) => {
            featuresOffsetY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.landingFeaturesHeading}>One portal, four essentials</Text>
          <Text style={styles.landingFeaturesSubheading}>
            Everything students and staff need for academic administration, in one place.
          </Text>

          <View style={styles.landingFeaturesGrid}>
            {LANDING_FEATURES.map((feature) => (
              <View key={feature.title} style={styles.landingFeatureCard}>
                <View style={styles.landingFeatureIconWrap}>
                  <Ionicons name={feature.icon} size={22} color="#0B0F19" />
                </View>
                <Text style={styles.landingFeatureTitle}>{feature.title}</Text>
                <Text style={styles.landingFeatureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Role-Based Section */}
        <View style={styles.landingRolesSection}>
          <View style={styles.landingRoleCard}>
            <View style={[styles.landingRoleIconWrap, styles.landingRoleIconWrapGold]}>
              <Ionicons name="school-outline" size={22} color="#0B0F19" />
            </View>
            <Text style={styles.landingRoleTitle}>For Students</Text>

            {STUDENT_ROLE_POINTS.map((point) => (
              <View key={point} style={styles.landingRoleBulletRow}>
                <Ionicons name="checkmark-circle" size={16} color="#CC8F2A" style={styles.landingRoleBulletIcon} />
                <Text style={styles.landingRoleBulletText}>{point}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.landingPrimaryBtn}
              onPress={goToRegister}
              activeOpacity={0.85}
            >
              <Text style={styles.landingPrimaryBtnText}>Create a student account →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.landingRoleCard}>
            <View style={[styles.landingRoleIconWrap, styles.landingRoleIconWrapNavy]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#F8FAFC" />
            </View>
            <Text style={styles.landingRoleTitle}>For Lecturers & Admins</Text>

            {STAFF_ROLE_POINTS.map((point) => (
              <View key={point} style={styles.landingRoleBulletRow}>
                <Ionicons name="checkmark-circle" size={16} color="#2A3D68" style={styles.landingRoleBulletIcon} />
                <Text style={styles.landingRoleBulletText}>{point}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.landingRoleStaffBtn}
              onPress={goToStaffLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.landingRoleStaffBtnText}>Sign in to the staff portal →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- AUTHENTICATION SCREENS ---
const LEVELS = ['100', '200', '300', '400', '500'];

function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const { login } = useAuth();
  const slowTimerRef = useRef(null);

  const isStaffIntent = route?.params?.intent === 'staff';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    setIsSlow(false);
    // If the request is still in flight after a few seconds, let the person
    // know why — most likely the free-tier backend is waking up from sleep.
    slowTimerRef.current = setTimeout(() => setIsSlow(true), 4000);

    try {
      const response = await api.post('/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      });

      const { token, data: userData } = response.data;
      await login(token, userData);
    } catch (error) {
      const { title, message } = describeRequestError(error);
      Alert.alert(title, message);
    } finally {
      clearTimeout(slowTimerRef.current);
      setIsSlow(false);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.authScrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Ionicons name={isStaffIntent ? 'briefcase-outline' : 'school'} size={40} color="#2563eb" />
            </View>
            <Text style={styles.title}>{isStaffIntent ? 'Staff Sign In' : 'EduConnect GH'}</Text>
            <Text style={styles.subtitle}>
              {isStaffIntent
                ? 'Sign in with your lecturer or admin account'
                : 'Sign in to access your portal'}
            </Text>
          </View>

          <View style={styles.cardForm}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="student@educonnect.edu.gh"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
            </TouchableOpacity>

            {isSlow && (
              <Text style={styles.slowConnectionHint}>
                Still connecting — our free-tier server can take up to a minute to wake up on its
                first request. Hang tight…
              </Text>
            )}
          </View>

          <View style={styles.authFooterRow}>
            <Text style={styles.authFooterText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => navigation?.navigate('Register')} hitSlop={8}>
              <Text style={styles.authFooterLink}>Create a student account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [indexNumber, setIndexNumber] = useState('');
  const [program, setProgram] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const { login } = useAuth();
  const slowTimerRef = useRef(null);

  const handleRegister = async () => {
    if (!name || !email || !indexNumber || !password || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in your name, email, index number and password.');
      return;
    }
    if (!level) {
      Alert.alert('Missing Information', 'Please select your current level.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please re-enter your password to confirm it.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setIsSlow(false);
    slowTimerRef.current = setTimeout(() => setIsSlow(true), 4000);

    try {
      const response = await api.post('/auth/register', {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        indexNumber: indexNumber.trim(),
        program: program.trim(),
        department: department.trim(),
        level,
      });

      const { token, data: userData } = response.data;
      // The register endpoint returns the same shape as login, so we can log
      // the new student straight in rather than sending them back to a form.
      await login(token, userData);
    } catch (error) {
      const { title, message } = describeRequestError(error);
      Alert.alert(title, message);
    } finally {
      clearTimeout(slowTimerRef.current);
      setIsSlow(false);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.authScrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Ionicons name="person-add-outline" size={40} color="#2563eb" />
            </View>
            <Text style={styles.title}>Create a Student Account</Text>
            <Text style={styles.subtitle}>Join EduConnect GH to track your academic journey</Text>
          </View>

          <View style={styles.cardForm}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ama Serwaa Boateng"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="student@educonnect.edu.gh"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Student ID / Index Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10920145"
                  placeholderTextColor="#94a3b8"
                  value={indexNumber}
                  onChangeText={setIndexNumber}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Program (optional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="book-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. BSc Computer Science"
                  placeholderTextColor="#94a3b8"
                  value={program}
                  onChangeText={setProgram}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Department (optional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Computer Science"
                  placeholderTextColor="#94a3b8"
                  value={department}
                  onChangeText={setDepartment}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Level</Text>
              <View style={styles.levelPillRow}>
                {LEVELS.map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.levelPill, level === lvl && styles.levelPillActive]}
                    onPress={() => setLevel(lvl)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.levelPillText, level === lvl && styles.levelPillTextActive]}>
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
            </TouchableOpacity>

            {isSlow && (
              <Text style={styles.slowConnectionHint}>
                Still connecting — our free-tier server can take up to a minute to wake up on its
                first request. Hang tight…
              </Text>
            )}
          </View>

          <View style={styles.authFooterRow}>
            <Text style={styles.authFooterText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation?.navigate('Login')} hitSlop={8}>
              <Text style={styles.authFooterLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- APP ENTRY POINT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        const storedUser = await SecureStore.getItemAsync('userData');
        if (storedToken && storedUser) {
          // Set the header BEFORE setToken(). setToken() can cause the
          // Dashboard tree to mount in this same commit, and child effects
          // fire before parent effects - so if this were done in a separate
          // useEffect watching `token`, the first API call could go out
          // before the header was attached. Setting it synchronously here,
          // in the same function that changes the token, removes that race
          // entirely instead of depending on effect ordering.
          api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn('Failed to fetch auth state', e);
      } finally {
        setIsLoading(false);
        // Safely dismiss native Android splash screen after mounting JS bundle
        await SplashScreen.hideAsync().catch(() => {});
      }
    };
    checkToken();
  }, []);

  const login = async (newToken, userData) => {
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    await SecureStore.setItemAsync('userToken', newToken);
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    delete api.defaults.headers.common.Authorization;
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    setToken(null);
    setUser(null);
  };

  if (isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={token ? 'Dashboard' : 'Landing'}
        >
          {token ? (
            <Stack.Screen name="Dashboard" component={DashboardLayout} />
          ) : (
            <>
              <Stack.Screen name="Landing" component={LandingScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  authContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, backgroundColor: '#f1f5f9' },
  brandHeader: { alignItems: 'center', marginBottom: 28 },
  logoBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, textAlign: 'center' },
  cardForm: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#0f172a' },
  button: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc' },
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  screenSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  roleBadge: { fontSize: 14, fontWeight: '600', color: '#2563eb', marginBottom: 20 },
  logoutBtn: { flexDirection: 'row', backgroundColor: '#ef4444', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  detailText: { fontSize: 16, color: '#334155', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  card: { backgroundColor: '#ffffff', width: '48%', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#1e293b' },

  // --- Landing screen ---
  landingSafeArea: { flex: 1, backgroundColor: '#0B0F19' },
  landingScroll: { flex: 1, backgroundColor: '#ffffff' },
  landingScrollContent: { flexGrow: 1 },

  landingHeader: {
    backgroundColor: '#0B0F19',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  landingBrand: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 8 },
  landingBrandMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E4A93F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  landingBrandMarkText: { fontSize: 12, fontWeight: '800', color: '#0B0F19' },
  landingBrandName: { fontSize: 14, fontWeight: '700', color: '#F8FAFC', flexShrink: 1 },
  landingHeaderLinks: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  landingHeaderLinkText: { fontSize: 13, fontWeight: '600', color: '#CBD5E1' },
  landingHeaderCta: {
    backgroundColor: 'rgba(228,169,63,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(228,169,63,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginLeft: 10,
  },
  landingHeaderCtaText: { fontSize: 12, fontWeight: '700', color: '#E4A93F' },

  landingHero: {
    backgroundColor: '#0B0F19',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 44,
    overflow: 'hidden',
  },
  landingHeroGlowGold: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(228,169,63,0.16)',
  },
  landingHeroGlowNavy: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(60,81,133,0.28)',
  },
  landingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(228,169,63,0.35)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 18,
  },
  landingBadgeText: { fontSize: 12, fontWeight: '600', color: '#EEC35A' },
  landingHeadline: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 14,
  },
  landingHeadlineAccent: { color: '#E4A93F' },
  landingSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#94A3B8',
    marginBottom: 26,
  },
  landingHeroActions: { gap: 12 },
  landingPrimaryBtn: {
    backgroundColor: '#E4A93F',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  landingPrimaryBtnText: { fontSize: 15, fontWeight: '700', color: '#0B0F19' },
  landingSecondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.35)',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  landingSecondaryBtnText: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },

  landingFeaturesSection: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },
  landingFeaturesHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172E',
    textAlign: 'center',
    marginBottom: 8,
  },
  landingFeaturesSubheading: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  landingFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  landingFeatureCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  landingFeatureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F4D890',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  landingFeatureTitle: { fontSize: 15, fontWeight: '700', color: '#0F172E', marginBottom: 4 },
  landingFeatureDescription: { fontSize: 12.5, lineHeight: 17, color: '#64748b' },

  // --- Auth form additions (Login / Register) ---
  authScrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  slowConnectionHint: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  authFooterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  authFooterText: { fontSize: 14, color: '#64748b' },
  authFooterLink: { fontSize: 14, color: '#2563eb', fontWeight: '700' },
  levelPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelPill: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  levelPillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  levelPillText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  levelPillTextActive: { color: '#ffffff' },

  // --- Landing header restructure (Log in / Get started) ---
  landingHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  landingHeaderActions: { flexDirection: 'row', alignItems: 'center' },
  landingLoginLink: { paddingHorizontal: 8, paddingVertical: 6 },
  landingLoginLinkText: { fontSize: 13, fontWeight: '600', color: '#F8FAFC' },

  // --- Landing role-based section ---
  landingRolesSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  landingRoleCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 20,
  },
  landingRoleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  landingRoleIconWrapGold: { backgroundColor: '#F4D890' },
  landingRoleIconWrapNavy: { backgroundColor: '#0F172E' },
  landingRoleTitle: { fontSize: 17, fontWeight: '800', color: '#0F172E', marginBottom: 12 },
  landingRoleBulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  landingRoleBulletIcon: { marginTop: 2, marginRight: 8 },
  landingRoleBulletText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: '#334155' },
  landingRoleStaffBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2A3D68',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  landingRoleStaffBtnText: { fontSize: 15, fontWeight: '700', color: '#0F172E' },

  // --- Dashboard screens (Overview / Processes / Materials / Announcements / Students / Profile) ---
  dashScreen: { flex: 1, backgroundColor: '#F8FAFC' },
  dashScreenContent: { padding: 16, paddingBottom: 32 },
  screenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  screenHeading: { fontSize: 19, fontWeight: '800', color: '#0B0F19' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#F8FAFC', fontSize: 13, fontWeight: '700', marginLeft: 4 },

  welcomeTitle: { fontSize: 22, fontWeight: '800', color: '#0B0F19', marginBottom: 8 },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F172E',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 20,
  },
  rolePillText: { fontSize: 12, fontWeight: '700', color: '#F4D890' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0B0F19' },
  statLabel: { fontSize: 12.5, color: '#64748b', marginTop: 2 },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#0B0F19' },
  viewAllLink: { fontSize: 13, fontWeight: '700', color: '#2A3D68' },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 19,
  },

  badgePill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgePillText: { fontSize: 11.5, fontWeight: '700', color: '#475569' },

  requestCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  requestCardStudent: { fontSize: 14.5, fontWeight: '700', color: '#0B0F19', flex: 1, marginRight: 8 },
  requestCardType: { fontSize: 13, color: '#334155', fontWeight: '600', marginBottom: 2 },
  requestCardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  requestCardDescription: { fontSize: 13, color: '#334155', marginTop: 8, lineHeight: 18 },
  requestCardRemarks: { fontSize: 12.5, color: '#B8861B', marginTop: 8, fontStyle: 'italic' },

  remarksInput: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  requestActionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  approveBtn: { flex: 1, backgroundColor: '#188044', paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  approveBtnText: { color: '#ffffff', fontSize: 12.5, fontWeight: '700' },
  reviewBtn: { flex: 1, backgroundColor: '#2A3D68', paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  reviewBtnText: { color: '#ffffff', fontSize: 12.5, fontWeight: '700' },
  rejectBtn: { flex: 1, backgroundColor: '#B23434', paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  rejectBtnText: { color: '#ffffff', fontSize: 12.5, fontWeight: '700' },

  linkBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  linkBtnText: { fontSize: 13, fontWeight: '700', color: '#0B0F19', marginLeft: 6 },

  textAreaWrapper: { height: 90, alignItems: 'flex-start', paddingVertical: 10 },
  textArea: { height: 70 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,15,25,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '88%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0B0F19', marginBottom: 16 },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 8 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: { fontSize: 14.5, fontWeight: '700', color: '#475569' },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: '#0B0F19',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSubmitBtnText: { fontSize: 14.5, fontWeight: '700', color: '#ffffff' },

  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchBarInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#0f172a' },

  profileHeader: { alignItems: 'center', paddingVertical: 20 },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0F172E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#F4D890' },
  profileName: { fontSize: 19, fontWeight: '800', color: '#0B0F19' },
  profileEmail: { fontSize: 13.5, color: '#64748b', marginTop: 2, marginBottom: 10 },
  profileInfoCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  profileInfoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  profileInfoLabel: { fontSize: 11.5, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' },
  profileInfoValue: { fontSize: 14.5, color: '#0B0F19', fontWeight: '600', marginTop: 2 },
});