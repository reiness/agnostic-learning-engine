import React, { useState } from 'react';
import { collection, addDoc, doc, writeBatch } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { generateCourse } from '../services/gemini';

const CourseCreationForm = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('7_days');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateCourse = async (e) => {
    e.preventDefault();
    if (!user) {
      console.error("User not logged in.");
      return;
    }
    setIsLoading(true);
    try {
      const courseData = await generateCourse(topic, duration);
      if (!courseData || !courseData.title || !Array.isArray(courseData.dailyModules)) {
        console.error("Invalid course data structure received from API:", courseData);
        alert("Error: The generated course data was incomplete. Please try again.");
        return;
      }
      const coursesRef = collection(db, 'courses');
      const newCourseDocRef = await addDoc(coursesRef, {
        userId: user.uid,
        title: courseData.title,
        durationDays: parseInt(duration.replace('_days', '')),
        originalPrompt: topic,
        status: 'active',
        createdAt: new Date()
      });
      const newCourseId = newCourseDocRef.id;
      const batch = writeBatch(db);
      courseData.dailyModules.forEach(module => {
        const day = module.day.toString();
        const moduleRef = doc(db, 'courses', newCourseId, 'modules', day);
        batch.set(moduleRef, {
          title: module.title,
          description: module.description,
          learningMaterial: "",
          isCompleted: false
        });
      });
      await batch.commit();
      navigate(`/course/${newCourseId}`);
    } catch (error) {
      console.error('Error generating course:', error);
      alert("Error: Course generation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleGenerateCourse} className="p-8 bg-card text-card-foreground rounded-xl shadow-2xl space-y-6">
      <h2 className="text-3xl font-bold">Create a New Course</h2>
      <div className="space-y-2">
        <Label htmlFor="courseTopic">What do you want to learn?</Label>
        <Textarea
          id="courseTopic"
          placeholder="e.g., Advanced TypeScript for modern web development..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="duration">How long do you have?</Label>
        <Select value={duration} onValueChange={setDuration} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select a duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7_days">7 Days</SelectItem>
            <SelectItem value="14_days">14 Days</SelectItem>
            <SelectItem value="30_days">30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Generating Your Course...' : 'Generate My Course'}
      </Button>
    </form>
  );
};

export default CourseCreationForm;