export function deriveFamilyMembersFromRecords(records) {
  const membersById = new Map();

  (records || []).forEach((record) => {
    const memberId = record?.familyMemberId;
    if (!memberId) return;

    if (!membersById.has(memberId)) {
      membersById.set(memberId, {
        id: memberId,
        firstName: record?.familyMemberFirstName || "Family",
        lastName: record?.familyMemberLastName || `Member ${memberId}`,
        relationship: record?.familyMemberRelationship || "Dependent",
        recordsCount: 0,
        lastRecordAt: null
      });
    }

    const member = membersById.get(memberId);
    member.recordsCount += 1;

    const recordTime = record?.recordDate || record?.createdAt || null;
    if (!member.lastRecordAt || (recordTime && new Date(recordTime) > new Date(member.lastRecordAt))) {
      member.lastRecordAt = recordTime;
    }
  });

  return Array.from(membersById.values()).sort((a, b) => {
    if (!a.lastRecordAt && !b.lastRecordAt) return 0;
    if (!a.lastRecordAt) return 1;
    if (!b.lastRecordAt) return -1;
    return new Date(b.lastRecordAt) - new Date(a.lastRecordAt);
  });
}

export function filterRecordsByProfile(records, selectedPerson) {
  if (selectedPerson?.type === "family") {
    return (records || []).filter((record) => record?.familyMemberId === selectedPerson.id);
  }

  return (records || []).filter((record) => !record?.familyMemberId);
}
