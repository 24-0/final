export async function joinGroup(groupId: string) {
  try {
    const response = await fetch(`/api/groups/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join group');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
}
