import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, TextField, Button, Typography, InputAdornment, IconButton, Divider } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import GoogleIcon from '@mui/icons-material/Google';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import * as z from "zod";
import { Link as RouterLink } from "react-router";
import Link from "@mui/material/Link";
import { useSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../../firebase/firebase";
import { handleCurrentUser } from "../../redux/slice/authSlice";
import { getDocs, query, where, doc, setDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import './auth.css';

function Register() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const signupSchema = z.object({
    userName: z.string().min(3, "Username must be at least 3 characters"),
    email: z
      .string()
      .min(1, { message: "Email is required." })
      .email("Invalid email address."),
    password: z
      .string()
      .trim()
      .min(6, "Password must be at least 6 characters"),
  });

  type SignupForm = z.infer<typeof signupSchema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (user: SignupForm) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );

      const firebaseUser = userCredential.user;

      await setDoc(doc(db, "users", firebaseUser.uid), {
        id: firebaseUser.uid,
        userName: user.userName,
        email: firebaseUser.email,
        photoUrl: firebaseUser.photoURL || null,
        provider: "email",
        createdAt: serverTimestamp(),
        isOnline: true
      });

      dispatch(
        handleCurrentUser({
          id: String(firebaseUser.uid),
          userName: user.userName,
          email: firebaseUser.email,
          photoUrl: firebaseUser.photoURL,
        })
      );

      enqueueSnackbar("Account created successfully!", { variant: 'success', autoHideDuration: 3000 });
      navigate("/Dashboard");
    } catch (error: any) {
      console.error(error);
      enqueueSnackbar(error.message || "Registration failed", { variant: 'error', autoHideDuration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const response = await signInWithPopup(auth, googleProvider);
      const firebaseUser = response.user;
      
      const existingQuery = query(
        collection(db, "users"),
        where("email", "==", firebaseUser.email)
      );
      const existed = await getDocs(existingQuery);

      if (existed.empty) {
        await setDoc(doc(db, "users", firebaseUser.uid), {
          id: firebaseUser.uid,
          userName: firebaseUser.displayName || null,
          email: firebaseUser.email,
          photoUrl: firebaseUser.photoURL,
          provider: "google",
          createdAt: serverTimestamp(),
          isOnline: true
        });
      } else {
        const docRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(docRef, {
          isOnline: true
        });
      }

      dispatch(
        handleCurrentUser({
          id: firebaseUser.uid,
          userName: firebaseUser.displayName || null,
          email: firebaseUser.email,
          photoUrl: firebaseUser.photoURL,
        })
      );

      enqueueSnackbar("Signed in with Google!", { variant: 'success', autoHideDuration: 3000 });
      navigate("/Dashboard");
    } catch (error: any) {
      console.error("Google Sign-in Error:", error);
      enqueueSnackbar(error.message, { variant: 'error', autoHideDuration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-container">
      <div className="auth-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <ChatBubbleIcon className="logo-icon" />
            <h1>ChatApp</h1>
          </div>
          <h2>Create Account</h2>
          <p>Join us and start chatting with friends</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <Controller
            name="userName"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <TextField
                  {...field}
                  label="Username"
                  variant="outlined"
                  fullWidth
                  error={!!errors.userName}
                  helperText={errors.userName?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon className="input-icon" />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <TextField
                  {...field}
                  label="Email Address"
                  variant="outlined"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon className="input-icon" />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <TextField
                  {...field}
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  variant="outlined"
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon className="input-icon" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
            )}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            className="submit-btn"
          >
            {loading ? (
              <>
                <div className="button-spinner"></div>
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </Button>

          <Divider className="divider">
            <span className="divider-text">OR</span>
          </Divider>

          <Button
            onClick={signInWithGoogle}
            variant="outlined"
            size="large"
            fullWidth
            disabled={loading}
            className="google-btn"
            startIcon={<GoogleIcon />}
          >
            Continue with Google
          </Button>
        </form>

        <Typography className="auth-footer">
          Already have an account?
          <Link component={RouterLink} to="/" className="auth-link">
            Sign in
          </Link>
        </Typography>
      </div>
    </Box>
  );
}

export default Register;