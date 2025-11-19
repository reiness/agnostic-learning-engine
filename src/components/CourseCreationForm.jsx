import React, { useState, useEffect } from 'react';
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
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast from 'react-hot-toast'; // Import react-hot-toast directly
import { checkAndResetCredits } from '../services/credits';
import Spinner from './Spinner';
import { logActivity } from '../services/activityService';

const CourseCreationForm = () => {
  const [user] = useAuthState(auth);
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('7_days');
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const fetchCredits = async () => {
      if (user) {
        const userCredits = await checkAndResetCredits(user.uid);
        setCredits(userCredits);
      }
    };
    fetchCredits();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    logger.info('Course creation form submitted.');

    const trimmedTopic = topic.trim();

    if (!trimmedTopic) {
      toast.error('Please enter a topic.');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a course.');
      return;
    }

    if (credits <= 0) {
      toast.error("You have insufficient credits to generate a course.");
      return;
    }

    setIsLoading(true);
    // This is the ONLY toast this component will show.
    // The final result (success or failure) is handled by the NotificationContext listener.
    toast.success("Course generation started! Check the notification bell for updates.");

    try {
      const token = await user.getIdToken();
      await fetch("/.netlify/functions/generateCourse-background", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: trimmedTopic,
          duration: duration,
          userId: user.uid
        })
      });

      // We optimistically log the activity and reset the form.
      await logActivity(user.uid, user.email, 'generate_course', { topic: trimmedTopic, duration });
      setTopic('');
      setDuration('7_days');

    } catch (error) {
      // This catch block is for network errors only (e.g., user is offline).
      logger.error('Error triggering course generation:', error);
      toast.error("The request to start course generation failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 bg-card text-card-foreground rounded-xl shadow-2-xl space-y-6">
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