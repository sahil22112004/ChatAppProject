import { useForm, Controller } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, TextField, Button, Typography, Paper ,InputAdornment,IconButton} from '@mui/material';
import * as z from 'zod';
import {  Link as RouterLink } from "react-router";
import Link from '@mui/material/Link'; 
import { useSnackbar } from 'notistack';
import { useSelector, useDispatch } from 'react-redux'
import type{RootState} from '../../redux/store'
import { useNavigate } from "react-router";
import {  createUserWithEmailAndPassword  } from 'firebase/auth';
import { auth, googleProvider,db } from '../../firebase/firebase';  
import { signInWithPopup } from 'firebase/auth';
import {handleCurrentUser,handleRegister} from "../../redux/slice/authSlice"
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';






function Register() {
  let navigate = useNavigate();
  const {enqueueSnackbar} = useSnackbar()
  const [showPassword, setShowPassword] = useState(false);
  
//   console.log(users);
  const dispatch = useDispatch()
  const singupschema = z.object({
    userName: z
      .string()
      .min(1, 'User Name is required'),
    email:z
    .string()
    .min(1, { message: "This field has to be filled." })
    .email("This is not a valid email."),
    password: z
      .string()
      .trim()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
  });
  type loginInterface = z.z.infer<typeof singupschema>

  const {
    control, 
    handleSubmit,
    formState: { errors },
  } = useForm<loginInterface>({
    resolver: zodResolver(singupschema),
    defaultValues: {
      userName: '',
      email:'',
      password: '',

    },
  });

const onSubmit = async (user:loginInterface)=>{

    // console.log(user)
    // const existing = Users.find((i)=>i.userName==user.userName || i.email == user.email)
    // if(existing){
    //        enqueueSnackbar('Account with same Email or user Name already exists', {autoHideDuration: 3000})
    // }else{
    //     dispatch(handleRegister(user))
    //     navigate('/')
    // }
    await createUserWithEmailAndPassword(auth, user.email, user.password)
        .then((userCredential) => {
            // Signed in
            const User = userCredential.user;
            const user={
      id:Date.now(),
      uerName : User.displayName||null,
      email : User.email,
      photoUrl:User.photoURL


    }
    dispatch(handleRegister(user))
    dispatch(handleCurrentUser(user))
            console.log(user);
            enqueueSnackbar('Register Successfully', {autoHideDuration: 3000})
            navigate("/")
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            enqueueSnackbar(errorMessage, {autoHideDuration: 3000})
        });
}

const signInWithGoogle = async () => {
  try {
    const response =  await signInWithPopup(auth, googleProvider);
    const user={
      id:Date.now(),
      uerName : response.user.displayName||null,
      email : response.user.email,
      photoUrl:response.user.photoURL


    }
    console.log("sending data",user)
    console.log("getting data",response.user)
    dispatch(handleRegister(user))
    dispatch(handleCurrentUser(user))
    navigate('/Dashboard')
    console.log(response.user)
    
    
  } catch (error) {
    console.error('Error signing in with Google', error);
  }
};


  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          boxShadow:'2'
        }}>
          <img src='https://freepngimg.com/thumb/logo/69662-instagram-media-brand-social-logo-photography.png' alt="Company Logo" width="300" height="150"/>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="userName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field} 
                  label="User Name "
                  variant="filled"
                  fullWidth
                  error={!!errors.userName}
                  helperText={errors.userName?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field} 
                  label="Email"
                  variant="filled"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
               name="password"
               control={control}
               render={({ field }) => (
               <TextField
                {...field}
                 label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="filled"
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{ mb: 2,width: 400 }}
                  InputProps={{
                   endAdornment: (
                 <InputAdornment position="end">
                 <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                     >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                     </InputAdornment>
                       )
                      }}
                     />
                   )}
                />


            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 2 }}
            >
              signup
            </Button>
            <Button
              onClick={signInWithGoogle}
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 2 }}
            >
              Sign in with Google
            </Button>
          </form>
          <Typography variant="h4" component="h2"  fontSize="15px" sx={{ fontStyle: 'italic' ,m:4 }} >
            Already have accout<Link component={RouterLink} to="/" underline="hover" sx={{ marginLeft: '5px' }} >login</Link>
          </Typography>
        </Paper>
      </Box>
    </>
  );
}

export default Register