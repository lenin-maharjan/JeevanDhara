// lib/screens/user/public_donor_profile_screen.dart

import 'package:flutter/material.dart';
import 'package:jeevandhara/models/user_model.dart';
import 'package:jeevandhara/services/api_service.dart'; // Make sure this path is correct
import 'package:intl/intl.dart';

class PublicDonorProfileScreen extends StatefulWidget {
  final String donorId;

  const PublicDonorProfileScreen({super.key, required this.donorId});

  @override
  _PublicDonorProfileScreenState createState() => _PublicDonorProfileScreenState();
}

class _PublicDonorProfileScreenState extends State<PublicDonorProfileScreen> {
  late Future<User> _donorFuture;

  @override
  void initState() {
    super.initState();
    // Use the donorId passed to the screen to fetch the user's data
    _donorFuture = _fetchDonorDetails(widget.donorId);
  }

  // Fetches a single donor's profile from your API
  Future<User> _fetchDonorDetails(String userId) async {
    try {
      final data = await ApiService().get('auth/profile/donor/$userId'); // Adjust API endpoint if needed
      return User.fromJson(data);
    } catch (e) {
      throw Exception('Failed to load donor profile: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      appBar: AppBar(
        title: const Text('Donor Profile'),
        backgroundColor: const Color(0xFFD32F2F),
      ),
      body: FutureBuilder<User>(
        future: _donorFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (snapshot.hasData) {
            final donor = snapshot.data!;
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Column(
                children: [
                  _buildProfileHeader(donor),
                  const SizedBox(height: 20),
                  _buildInfoCard(donor),
                  const SizedBox(height: 20),
                  _buildActionButtons(donor),
                ],
              ),
            );
          }
          return const Center(child: Text('Donor not found.'));
        },
      ),
    );
  }

  Widget _buildProfileHeader(User donor) {
    return Column(
      children: [
        CircleAvatar(
          radius: 50,
          backgroundColor: const Color(0xFFFFEBEE),
          child: Text(
            donor.bloodGroup ?? '?',
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Color(0xFFD32F2F),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          donor.fullName ?? 'N/A',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.location_on, color: Colors.grey, size: 16),
            const SizedBox(width: 4),
            Text(
              donor.location ?? 'N/A',
              style: const TextStyle(color: Colors.grey, fontSize: 16),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoCard(User donor) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            _buildInfoRow(
              Icons.bloodtype,
              'Blood Group',
              donor.bloodGroup ?? 'N/A',
            ),
            const Divider(),
            _buildInfoRow(
              Icons.check_circle_outline,
              'Availability',
              donor.isAvailable ? 'Available for Donation' : 'Not Available',
            ),
            const Divider(),
            _buildInfoRow(
              Icons.calendar_today,
              'Last Donation',
              donor.lastDonationDate != null
                  ? DateFormat('MMM d, yyyy').format(donor.lastDonationDate!)
                  : 'No record',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(User donor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: donor.isAvailable ? () { /* TODO: Implement call logic */ } : null,
              icon: const Icon(Icons.phone),
              label: const Text('Contact Donor'),
              style: ElevatedButton.styleFrom(
                foregroundColor: Colors.white,
                backgroundColor: const Color(0xFFD32F2F),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFFD32F2F), size: 20),
          const SizedBox(width: 16),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
          const Spacer(),
          Text(value, style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}





