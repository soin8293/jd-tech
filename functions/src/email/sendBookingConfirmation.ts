
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { getStripeClient } from "../config/stripe";
import { MailDataRequired } from "@sendgrid/mail";
import sgMail from '@sendgrid/mail';

/**
 * Cloud Function that sends booking confirmation emails with payment details
 * Triggered when a new booking document is created in Firestore
 */
export const sendBookingConfirmation = onDocumentCreated("bookings/{bookingId}", async (event) => {
  try {
    const bookingId = event.params.bookingId;
    const booking = event.data?.data();
    
    if (!booking) {
      console.error("No booking data found");
      return;
    }
    
    console.log(`Processing booking confirmation for booking: ${bookingId}`);
    
    // Check if the booking has necessary data
    if (!booking.userEmail) {
      console.error("Missing user email in booking, cannot send confirmation");
      return;
    }
    
    // Initialize SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
    
    // Retrieve payment details from Stripe if available
    let paymentIntent: any = null;
    let paymentDetails = "";
    
    if (booking.paymentIntentId) {
      try {
        console.log(`Retrieving payment intent: ${booking.paymentIntentId}`);
        const stripe = getStripeClient();
        paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
          
          // Format payment information for the email
          const amount = (paymentIntent.amount / 100).toFixed(2);
          const currency = paymentIntent.currency.toUpperCase();
          const paymentMethod = paymentIntent.payment_method_types.join(", ");
          const paymentDate = new Date(paymentIntent.created * 1000).toLocaleDateString();
          
          paymentDetails = `
            <h3>Payment Details:</h3>
            <ul>
              <li>Amount: ${currency} ${amount}</li>
              <li>Payment Method: ${paymentMethod}</li>
              <li>Transaction Date: ${paymentDate}</li>
              ${paymentIntent.receipt_url ? 
                `<li><a href="${paymentIntent.receipt_url}" style="color: #3366CC;">View Payment Receipt</a></li>` 
                : ""}
            </ul>
          `;
      } catch (error) {
        console.error("Error retrieving payment intent:", error);
        paymentDetails = "<p>Payment information is not available at this time.</p>";
      }
    } else {
      console.log("No payment intent ID available for this booking");
      paymentDetails = "<p>Payment information is not available for this booking.</p>";
    }
    
    // Format booking details for the email
    const roomsBooked = booking.bookingDetails?.rooms.map((room: any) => 
      `${room.name || 'Room'} (${room.bed || 'Standard'})`).join(", ") || "Not specified";
      
    const checkInDate = booking.period?.startDate ? 
      new Date(booking.period.startDate.seconds * 1000).toLocaleDateString() : 
      new Date(booking.period?.checkIn).toLocaleDateString();
      
    const checkOutDate = booking.period?.endDate ? 
      new Date(booking.period.endDate.seconds * 1000).toLocaleDateString() : 
      new Date(booking.period?.checkOut).toLocaleDateString();
    
    // Prepare the email
    const userName = booking.userName || booking.userEmail.split('@')[0] || "Guest";
    
    const msg: MailDataRequired = {
      to: booking.userEmail,
      from: "bookings@jdsuites.com", // Update with your SendGrid verified sender
      subject: "Your JD Suites Booking Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333;">Booking Confirmation</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear ${userName},</p>
            
            <p>Thank you for booking with JD Suites. Your reservation has been confirmed!</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Booking Details</h3>
              <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Booking ID:</strong> ${bookingId}</li>
                <li><strong>Rooms:</strong> ${roomsBooked}</li>
                <li><strong>Check-in Date:</strong> ${checkInDate}</li>
                <li><strong>Check-out Date:</strong> ${checkOutDate}</li>
                <li><strong>Number of Guests:</strong> ${booking.guests || "Not specified"}</li>
              </ul>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              ${paymentDetails}
            </div>
            
            <p>We're looking forward to welcoming you to JD Suites. If you have any questions or special requirements, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>JD Suites Team</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };
    
    // Send the email
    await sgMail.send(msg);
    console.log(`Booking confirmation email sent to ${booking.userEmail} for booking ${bookingId}`);
    
    // Update the booking document to indicate that the confirmation email was sent
    await admin.firestore().collection("bookings").doc(bookingId).update({
      confirmationEmailSent: true,
      confirmationEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return { error: "Failed to send booking confirmation email" };
  }
});
