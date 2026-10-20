<?php

namespace Database\Seeders;

use App\Models\AbsenceCategory;
use App\Models\ExcuseRequest;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---- Teachers (reviewers) ----
        $teachers = collect([
            ['T-1001', 'Jhon lyod Catalan'],
            ['T-1002', 'Ricardo JR Rosco'],
            ['T-1003', 'Sheryl Enriquez'],
            ['T-1004', 'Christine May Jabal'],
        ])->map(fn($t) => User::create([
                'id_number' => $t[0],
                'name' => $t[1],
                'password' => 'password',
                'role' => User::TEACHER,
            ]));

        // ---- Students ----
        $students = collect([
            ['15749', 'Hope John Bagaipo'],  // demo student account
            ['15750', 'Mike Palapar'],
            ['15751', 'Clarke Murcia'],
            ['15752', 'Kindred Notarte'],
            ['15753', 'Harvey Quibol'],
            ['15754', 'Alaniel Salada'],
            ['15755', 'Jan Pelayre'],
            ['15756', 'John Ampong'],
            ['15757', 'Patrick Gallego'],
            ['25000', 'Sari Jane'],
        ])->map(fn($s) => User::create([
                'id_number' => $s[0],
                'name' => $s[1],
                'password' => $s[0],
                'role' => User::STUDENT,
            ]));

        // ---- Categories ----
        $cat = collect([
            ['Medical / Illness', true],
            ['Family Emergency', false],
            ['Bereavement', true],
            ['School Activity / Competition', true],
            ['Transportation Problem', false],
            ['Weather / Calamity', false],
        ])->mapWithKeys(fn($c) => [$c[0] => AbsenceCategory::create(['name' => $c[0], 'requires_attachment' => $c[1]])]);

        // ---- Subjects ----
        $subjects = collect([
            [0, 'WS 301', 'Web Systems & Technologies'],
            [2, 'IM301', 'Information Management 2'],
            [1, 'NET 301', 'Networking 2'],
            [3, 'DC 302', 'Domain Course 4'],
        ])->map(fn($s) => Subject::create(['teacher_id' => $teachers[$s[0]]->id, 'code' => $s[1], 'name' => $s[2]]));

        // ---- Excuse requests: realistic mix, 30 records ----
        $samples = [
            ['Medical / Illness', 'Diagnosed with acute gastroenteritis and advised bed rest by the attending physician.', 'approved', 'Medical certificate verified. Please coordinate with me for missed quiz.'],
            ['Medical / Illness', 'High fever and cough; consulted at the school clinic and sent home.', 'approved', 'Get well soon. Excused for the dates indicated.'],
            ['Family Emergency', 'My mother was rushed to the hospital and I had to accompany her overnight.', 'approved', 'Approved. Please submit the activity you missed by Friday.'],
            ['Bereavement', 'Passing of my grandfather. The family traveled to the province for the wake and burial.', 'approved', 'Our condolences. Excused.'],
            ['School Activity / Competition', 'Representing the college in the regional programming contest; official travel order attached.', 'approved', 'Approved based on the signed travel order.'],
            ['Transportation Problem', 'The jeepney line along my route was suspended due to a road accident and I arrived after the class.', 'rejected', 'Transportation delays are not sufficient grounds for a full-day excuse. Marked late instead.'],
            ['Weather / Calamity', 'Our barangay was flooded after the typhoon and the road to school was impassable.', 'approved', 'Approved. Stay safe.'],
            ['Medical / Illness', 'Dental surgery scheduled in the morning; the dentist advised rest for two days.', 'pending', null],
            ['Family Emergency', 'Had to look after my younger siblings while my parents attended to a family matter.', 'rejected', 'Reason is too general and no supporting detail was provided.'],
            ['Medical / Illness', 'Dengue confirmed by blood test, admitted for observation.', 'pending', null],
            ['Transportation Problem', 'Bus breakdown on the highway on the way to the campus; stuck for three hours.', 'pending', null],
            ['School Activity / Competition', 'Joined the intercollegiate basketball tournament as a team member.', 'pending', null],
        ];

        $minimalPdf = "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
            . "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
        Storage::disk('public')->put('attachments/sample-supporting-document.pdf', $minimalPdf);

        for ($i = 0; $i < 30; $i++) {
            $s = $samples[$i % count($samples)];
            $subject = $subjects[$i % $subjects->count()];
            $from = now()->subDays(random_int(1, 70))->startOfDay();
            $reviewed = $s[2] === 'pending' ? null : (clone $from)->addDays(random_int(1, 3));

            $excuse = ExcuseRequest::create([
                'user_id' => $students[$i % $students->count()]->id,
                'subject_id' => $subject->id,
                'category_id' => $cat[$s[0]]->id,
                'date_from' => $from->toDateString(),
                'date_to' => (clone $from)->addDays(random_int(0, 2))->toDateString(),
                'reason' => $s[1],
                'status' => $s[2],
                'teacher_remarks' => $s[3],
                'reviewed_at' => $reviewed,
            ]);

            if ($cat[$s[0]]->requires_attachment) {
                $excuse->attachments()->create([
                    'file_path' => 'attachments/sample-supporting-document.pdf',
                    'original_name' => 'supporting-document.pdf',
                ]);
            }
        }
    }
}
