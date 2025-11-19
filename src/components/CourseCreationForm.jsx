import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, writeBatch, runTransaction } from 'firebase/firestore';
import logger from '../utils/logger';
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
import { generateCourse } from '../services/gemini';
import { checkAndResetCredits } from '../services/credits';
import Spinner from './Spinner'; // Import Spinner component
import { logActivity } from '../services/activityService';

const CourseCreationForm = () => {
  const [user] = useAuthState(auth);
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('7_days');
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    logger.debug('CourseCreationForm state changed:', { topic, duration, isLoading, credits });
  }, [topic, duration, isLoading, credits]);

  useEffect(() => {
    const fetchCredits = async () => {
      if (user) {
        const userCredits = await checkAndResetCredits(user.uid);
        setCredits(userCredits);
      }
    };
    fetchCredits();
  }, [user]);

  const handleGenerateCourse = async (e) => {
    e.preventDefault();
    logger.info('Course creation form submitted.');

    const trimmedTopic = topic.trim();

    if (!trimmedTopic) {
      alert('Please enter a topic.');
      return;
    }

    if (!user) {
      console.error("User not logged in.");
      return;
    }

    if (credits <= 0) {
      alert("You have insufficient credits to generate a course.");
      return;
    }

    setIsLoading(true);
    try {
      // "Fire and Forget" call to our new background function
      await fetch("/.netlify/functions/generateCourse-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic,
          duration: duration,
          userId: user.uid
        })
      });

      // Show a success message
      alert("Course generation started! We'll notify you when it's ready.");
      // Log the activity
      await logActivity(user.uid, user.email, 'generate_course', { topic: trimmedTopic, duration });
      // Reset the form
      setTopic('');
      setDuration('7_days');

    } catch (error) {
      logger.error('Error triggering course generation:', error);
      alert("Error: Could not start the course generation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleGenerateCourse} className="p-8 bg-card text-card-foreground rounded-xl shadow-2xl space-y-6">
      <h2 className="text-3xl font-bold">Create a New Course</h2>
      {/* <p className="text-sm text-muted-foreground">
        1 course generation costs 1 credit. Your credits reset daily.
      </p> */}
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
        {isLoading ? (
          <>
            <Spinner className="mr-2 h-5 w-5" /> Generating Your Course...
          </>
        ) : (
          'Generate My Course'
        )}
      </Button>
    </form>
  );
};

export default CourseCreationForm;