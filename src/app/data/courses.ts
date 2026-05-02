export interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed?: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  instructor: {
    name: string;
    avatar: string;
    bio: string;
  };
  thumbnail: string;
  rating: number;
  students: number;
  duration: string;
  modules: Module[];
  progress?: number;
}

export const courses: Course[] = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    description: "Master HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build real-world projects and become a full-stack developer.",
    price: 49.99,
    level: "Beginner",
    category: "Web Development",
    instructor: {
      name: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      bio: "Full-stack developer with 10+ years of experience. Passionate about teaching and helping students achieve their goals.",
    },
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop",
    rating: 4.8,
    students: 12543,
    duration: "42 hours",
    modules: [
      {
        id: "m1",
        title: "Introduction to Web Development",
        lessons: [
          { id: "l1", title: "What is Web Development?", duration: "12:30", completed: true },
          { id: "l2", title: "Setting Up Your Environment", duration: "15:45", completed: true },
          { id: "l3", title: "HTML Basics", duration: "25:20", completed: false },
        ],
      },
      {
        id: "m2",
        title: "CSS Fundamentals",
        lessons: [
          { id: "l4", title: "CSS Syntax and Selectors", duration: "18:15", completed: false },
          { id: "l5", title: "Box Model and Layout", duration: "22:40", completed: false },
          { id: "l6", title: "Flexbox and Grid", duration: "30:25", completed: false },
        ],
      },
      {
        id: "m3",
        title: "JavaScript Essentials",
        lessons: [
          { id: "l7", title: "Variables and Data Types", duration: "20:10", completed: false },
          { id: "l8", title: "Functions and Scope", duration: "25:35", completed: false },
          { id: "l9", title: "DOM Manipulation", duration: "28:50", completed: false },
        ],
      },
    ],
    progress: 15,
  },
  {
    id: "2",
    title: "Python for Data Science",
    description: "Learn Python programming and data analysis with pandas, NumPy, and visualization libraries. Perfect for aspiring data scientists.",
    price: 39.99,
    level: "Intermediate",
    category: "Data Science",
    instructor: {
      name: "Michael Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      bio: "Data scientist and ML engineer. Former Google researcher with expertise in machine learning and AI.",
    },
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop",
    rating: 4.9,
    students: 8932,
    duration: "35 hours",
    modules: [
      {
        id: "m1",
        title: "Python Basics",
        lessons: [
          { id: "l1", title: "Introduction to Python", duration: "14:20" },
          { id: "l2", title: "Data Structures", duration: "22:15" },
        ],
      },
    ],
    progress: 0,
  },
  {
    id: "3",
    title: "UI/UX Design Masterclass",
    description: "Learn design thinking, user research, wireframing, prototyping, and creating beautiful interfaces with Figma.",
    price: 44.99,
    level: "Beginner",
    category: "Design",
    instructor: {
      name: "Emily Davis",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      bio: "Senior product designer at a Fortune 500 company. Specializes in user-centered design and design systems.",
    },
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop",
    rating: 4.7,
    students: 6421,
    duration: "28 hours",
    modules: [
      {
        id: "m1",
        title: "Design Fundamentals",
        lessons: [
          { id: "l1", title: "What is UI/UX?", duration: "10:45" },
          { id: "l2", title: "Design Principles", duration: "18:30" },
        ],
      },
    ],
  },
  {
    id: "4",
    title: "Mobile App Development with React Native",
    description: "Build cross-platform mobile applications for iOS and Android using React Native and modern development practices.",
    price: 54.99,
    level: "Advanced",
    category: "Mobile Development",
    instructor: {
      name: "David Kumar",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      bio: "Mobile app developer and consultant. Built apps for startups and enterprise clients worldwide.",
    },
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop",
    rating: 4.6,
    students: 5234,
    duration: "38 hours",
    modules: [],
  },
  {
    id: "5",
    title: "Digital Marketing Fundamentals",
    description: "Master SEO, social media marketing, content strategy, and analytics to grow your business online.",
    price: 34.99,
    level: "Beginner",
    category: "Marketing",
    instructor: {
      name: "Jessica Taylor",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
      bio: "Digital marketing strategist with 8 years of experience helping brands grow their online presence.",
    },
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    rating: 4.5,
    students: 4812,
    duration: "24 hours",
    modules: [],
  },
  {
    id: "6",
    title: "Machine Learning A-Z",
    description: "Comprehensive guide to machine learning algorithms, deep learning, and AI applications using Python and TensorFlow.",
    price: 59.99,
    level: "Advanced",
    category: "Data Science",
    instructor: {
      name: "Dr. James Wilson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      bio: "PhD in Computer Science. AI researcher and educator with publications in top-tier conferences.",
    },
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop",
    rating: 4.9,
    students: 9876,
    duration: "52 hours",
    modules: [],
  },
];
