import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the access and refresh token"
    );
  }
};
// const registerUser = asyncHandler(async (req, res) => {
//   // get user details from frontend
//   // validation - not empty
//   // check if user already exists: username, email
//   // check for images, check for avatar
//   // upload them to cloudinary, avatar
//   // create user object - create entry in db
//   // remove password and refresh token field from response
//   // check for user creation
//   // return res

//   const { fullName, email, username, password } = req.body;
//   console.log("email:", email);

//   if (
//     [fullName, email, username, password].some((field) => field?.trim() === "")
//   ) {
//     throw new ApiError(400, "All fields are compulsory and required");
//   }

//   const existedUser = await User.findOne({
//     $or: [{ username }, { email }],
//   });

//   if (existedUser) {
//     throw new ApiError(409, "User with email or username already exist");
//   }

//   const avatarLocalPath =
//     req.files?.avatar && req.files.avatar.length > 0
//       ? req.files.avatar[0].path
//       : null;

//   if (!avatarLocalPath) {
//     throw new ApiError(400, "Avatar file is required");
//   }
//   let coverImageLocalPath;
//   if (
//     req.files &&
//     Array.isArray(req.files.coverImage) &&
//     req.files.coverImage.length > 0
//   ) {
//     coverImageLocalPath = req.files.coverImage[0].path;
//   }

//   const avatar = await uploadOnCloudinary(coverImageLocalPath);
//   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

//   if (!avatar) {
//     throw new ApiError(400, "Avatar file is required");
//   }

//   const user = User.create({
//     fullName,
//     avatar: avatar.url,
//     coverImage: coverImage?.url || "",
//     email,
//     password,
//     username: username.toLowerCase(),
//   });

//   const createdUser = await User.findById(user._id).select(
//     "-password -refreshToken "
//   );

//   if (!createdUser) {
//     throw new ApiError(500, "Something went wrong while registering the user");
//   }
//   return res
//     .status(201)
//     .json(new ApiResponse(200, createdUser, "User registered successfully"));
// });

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log("email:", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are compulsory and required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  const avatarLocalPath =
    req.files?.avatar && req.files.avatar.length > 0
      ? req.files.avatar[0].path
      : null;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // Upload to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath); // Use correct variable here
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or password is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError("404", "user not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError("401", "user invalid credentials");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged In successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200), {}, "USer logged out");
});

export { registerUser, loginUser, logoutUser };
