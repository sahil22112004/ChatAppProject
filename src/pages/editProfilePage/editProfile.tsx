import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { db, auth } from "../../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { handleCurrentUser } from "../../redux/slice/authSlice";
import "./editProfile.css";
import { useNavigate } from "react-router";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

const ProfileSchema = z.object({
  userName: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
});

type ProfileFormData = z.infer<typeof ProfileSchema>;

function EditProfile() {
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const dispatch = useDispatch();
  const [imagePreview, setImagePreview] = useState<string>(
    currentUser?.photoUrl || ""
  );
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      userName: currentUser?.userName || "",
      email: currentUser?.email || "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB for Cloudinary free tier)
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size should be less than 10MB");
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET??"");
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME??"");
    formData.append("folder", "profile_images"); // Optional: organize in folders

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("Failed to get image URL");
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile || !currentUser) return null;

    setUploading(true);
    try {
      const downloadURL = await uploadToCloudinary(selectedFile);
      return downloadURL;
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!currentUser) return;
    setLoading(true);

    try {
      let photoUrl = currentUser.photoUrl;

      if (selectedFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      await updateDoc(doc(db, "users", currentUser.id), {
        userName: data.userName,
        photoUrl: photoUrl,
      });

      await updateProfile(auth.currentUser!, {
        displayName: data.userName,
        photoURL: photoUrl,
      });

      dispatch(
        handleCurrentUser({
          ...currentUser,
          userName: data.userName,
          photoUrl: photoUrl,
        })
      );

      alert("Profile updated successfully!");
      navigate("/Dashboard");
    } catch (e) {
      console.error(e);
      alert("Something went wrong!");
    }

    setLoading(false);
  };

  if (!currentUser) {
    return (
      <div className="login-message">
        <h2>Please login first...</h2>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-card">
        <div className="profile-header">
          <button className="back-button" onClick={() => navigate("/Dashboard")}>
            <ArrowBackIcon />
          </button>
          <h1>Edit Profile</h1>
          <div></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
          <div className="profile-image-section">
            <div className="image-container">
              <img
                src={imagePreview || "/defaultImg.jpg"}
                alt="Profile"
                className="profile-image"
                onError={(e) => (e.currentTarget.src = "/defaultImg.jpg")}
              />
              <label htmlFor="image-upload" className="camera-overlay">
                <CameraAltIcon />
                <span>Change Photo</span>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>
            {uploading && (
              <div className="upload-progress">
                <div className="spinner"></div>
                <p>Uploading image...</p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <EmailIcon />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              disabled
              {...register("email")}
              className="form-input disabled"
            />
            <p className="input-hint">Email cannot be changed</p>
          </div>

          <div className="form-group">
            <label htmlFor="userName">
              <PersonIcon />
              Username
            </label>
            <input
              id="userName"
              type="text"
              {...register("userName")}
              className="form-input"
              placeholder="Enter your username"
            />
            {errors.userName && (
              <p className="error-text">{errors.userName.message}</p>
            )}
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="save-btn"
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <div className="button-spinner"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>

            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/Dashboard")}
              disabled={loading || uploading}
            >
              Cancel
            </button>
          </div>
        </form>


      </div>
    </div>
  );
}

export default EditProfile;