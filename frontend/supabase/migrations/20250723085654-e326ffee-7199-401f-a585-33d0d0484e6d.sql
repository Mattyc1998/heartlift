-- Add DELETE policy for conversation_history so users can clear their own conversations
CREATE POLICY "Users can delete their own conversation history" 
ON conversation_history 
FOR DELETE 
USING (auth.uid() = user_id);