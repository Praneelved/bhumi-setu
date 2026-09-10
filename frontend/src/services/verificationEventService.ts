import type { RejectionEvent } from '../types/governmentVerification';

// Event listener registry for viaSocket mock event queue
type RejectionListener = (event: RejectionEvent) => void;
const listeners: RejectionListener[] = [];

/**
 * Trigger document rejection event.
 * Prepared for future viaSocket integration:
 * Government Authority -> Reject Document -> Rejection Reason -> Backend -> viaSocket -> Email/Notification -> User
 */
export function notifyDocumentRejection(eventData: RejectionEvent): RejectionEvent {
  console.log('[viaSocket Notification Event Prepared]', eventData);
  
  // Dispatch event to local subscribers (UI Toast / Queue Badge)
  listeners.forEach((callback) => {
    try {
      callback(eventData);
    } catch (err) {
      console.error('Error in rejection event listener:', err);
    }
  });

  return eventData;
}

export function subscribeRejectionEvents(callback: RejectionListener): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

/**
 * Generates the mock viaSocket webhook request payload format
 */
export function formatViaSocketPayload(event: RejectionEvent) {
  return {
    event: 'DOCUMENT_VERIFICATION_FAILED',
    provider: 'viaSocket_v2',
    timestamp: event.timestamp,
    payload: {
      case_id: event.caseId,
      document_id: event.documentId,
      document_name: event.documentName,
      rejected_by: event.rejectedBy,
      authority_level: event.authorityLevel,
      issue_category: event.issueCategory,
      rejection_reason: event.reason,
    },
    email_template: {
      subject: `Land Acquisition Document Verification Failed - Case ${event.caseId}`,
      recipient_type: 'LAND_OWNER / AGENCY',
      body: `Your submitted document '${event.documentName}' for Case ${event.caseId} was rejected by ${event.authorityLevel}. Reason: ${event.reason}`
    }
  };
}
