

// This type object is mirroring the backend's MediaTypeSummaryDto
export interface MediaTypeSummary {
    id: number;
    name: string;

    description: string | null;

}


// This type object is mirroring the backend's MediaTypeDetailyDto
export interface MediaTypeDetail {
    id: number;
    name: string;

    description: string | null;

    // Submission Variables:

    // isApproved = false means only display to creator and the admins to approve/deny
    // and isApproved = True means its an option to choose/view for everyone
    isApproved: boolean;
    submittedById: string;
    dateSubmitted: string;
    
}