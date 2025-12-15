import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "../services/account/authApi";

interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLogout: () => void;
}

export function LogoutModal({
  open,
  onOpenChange,
  onConfirmLogout,
}: LogoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try{
      //get token from db
      const token = localStorage.getItem('aims_admin_token') || 
                    sessionStorage.getItem('aims_admin_token');
      if(token){
        try {
          await authApi.logout(token);
        } catch (apiError) {
          console.error('Logout API error:', apiError);
        }
    }
          // Clear all auth data from storage
      localStorage.removeItem('aims_admin_token');
      sessionStorage.removeItem('aims_admin_token');
      localStorage.removeItem('aims_admin_user');
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Close modal
      onOpenChange(false);
      
      // Call the parent callback to handle redirect
      onConfirmLogout();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Are you sure you want to logout?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            You will be signed out of your account and
            redirected to the homepage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto m-0">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmLogout}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}